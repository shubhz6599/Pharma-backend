import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { ApiResponse } from '../types';
import { sendOtpEmail } from '../utils/mailer';
import { logger } from '../utils/logger';

const JWT_SECRET  = process.env.JWT_SECRET  || 'pharma_secret_key_change_in_prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const OTP_EXPIRY  = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');

// ── Helpers ───────────────────────────────────────────────────
const generateToken = (id: string, email: string, role: string): string =>
  jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);

const generateOtp = (): string =>
  crypto.randomInt(100000, 999999).toString();

const setTokenCookie = (res: Response, token: string): void => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const userPayload = (user: any) => ({
  id:         user._id,
  name:       user.name,
  username:   user.username,
  email:      user.email,
  phone:      user.phone,
  role:       user.role,
  isVerified: user.isVerified,
});

// ── REGISTER ─────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, email, phone, password, role } = req.body;

    // Check uniqueness of username, email, phone individually for clear error messages
    const [byUsername, byEmail, byPhone] = await Promise.all([
      User.findOne({ username: username.toLowerCase() }),
      User.findOne({ email: email.toLowerCase() }),
      User.findOne({ phone }),
    ]);

    if (byUsername) { res.status(409).json({ success: false, message: `Username "${username}" is already taken. Please choose a different username.` }); return; }
    if (byEmail)    { res.status(409).json({ success: false, message: `Email "${email}" is already registered. Please use a different email or log in.` }); return; }
    if (byPhone)    { res.status(409).json({ success: false, message: `Phone number "${phone}" is already registered. Please use a different number.` }); return; }

    const otp       = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY * 60 * 1000);

    const user = await User.create({
      name, username: username.toLowerCase(), email: email.toLowerCase(),
      phone, password, role: role || 'pharmacist',
      isVerified: false, otp, otpExpiry, otpPurpose: 'verify',
    });

    // Send OTP email
    await sendOtpEmail(user.email, otp, 'verify');

    res.status(201).json({
      success: true,
      message: `OTP sent to ${user.email}. Please verify to complete registration.`,
      data: { userId: user._id, email: user.email },
    });
  } catch (error: any) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
};

// ── VERIFY OTP (Registration) ─────────────────────────────────
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry +otpPurpose');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    if (user.otpPurpose !== 'verify') { res.status(400).json({ success: false, message: 'OTP not requested for verification.' }); return; }
    if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' }); return;
    }
    if (user.otp !== otp.trim()) {
      res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' }); return;
    }

    // Mark verified and clear OTP
    user.isVerified  = true;
    user.otp         = undefined;
    user.otpExpiry   = undefined;
    user.otpPurpose  = undefined;
    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.role);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to PharmaTrack.',
      data: { token, user: userPayload(user) },
    });
  } catch (error: any) {
    logger.error('VerifyOTP error:', error);
    res.status(500).json({ success: false, message: error.message || 'OTP verification failed.' });
  }
};

// ── RESEND OTP ────────────────────────────────────────────────
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).select('+otp +otpExpiry +otpPurpose');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    const otp       = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    await user.save();

    await sendOtpEmail(user.email, otp, user.otpPurpose || 'verify');
    res.status(200).json({ success: true, message: `New OTP sent to ${user.email}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to resend OTP.' });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body; // identifier = email | username | phone

    // Build query: try matching email, username, or phone
    const user = await User.findOne({
      $or: [
        { email:    identifier.toLowerCase().trim() },
        { username: identifier.toLowerCase().trim() },
        { phone:    identifier.trim() },
      ],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/username/phone and password.' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your account first.',
        data: { userId: user._id, email: user.email, needsVerification: true },
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.email, user.role);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { token, user: userPayload(user) },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
};

// ── FORGOT PASSWORD: send OTP ─────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.body; // email | username | phone

    const user = await User.findOne({
      $or: [
        { email:    identifier.toLowerCase().trim() },
        { username: identifier.toLowerCase().trim() },
        { phone:    identifier.trim() },
      ],
    });

    // Always respond success to prevent user enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with those details, an OTP has been sent.',
      });
      return;
    }

    const otp       = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    user.otpPurpose = 'reset';
    await user.save();

    await sendOtpEmail(user.email, otp, 'reset');

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}.`,
      data: { userId: user._id },
    });
  } catch (error: any) {
    logger.error('ForgotPassword error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process request.' });
  }
};

// ── VERIFY RESET OTP ──────────────────────────────────────────
export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry +otpPurpose');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    if (user.otpPurpose !== 'reset') { res.status(400).json({ success: false, message: 'OTP not requested for password reset.' }); return; }
    if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' }); return;
    }
    if (user.otp !== otp.trim()) {
      res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' }); return;
    }

    // Generate a short-lived reset token (store as new OTP state, cleared on reset)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.otp        = resetToken;  // reuse otp field for reset token
    user.otpExpiry  = new Date(Date.now() + 15 * 60 * 1000); // 15 min to complete reset
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified. You may now reset your password.',
      data: { userId, resetToken },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'OTP verification failed.' });
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, resetToken, newPassword } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry +otpPurpose');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    if (!user.otp || user.otp !== resetToken || !user.otpExpiry || new Date() > user.otpExpiry) {
      res.status(400).json({ success: false, message: 'Reset session expired. Please start over.' }); return;
    }

    user.password   = newPassword;
    user.otp        = undefined;
    user.otpExpiry  = undefined;
    user.otpPurpose = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Password reset failed.' });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────
export const logout = (_req: Request, res: Response): void => {
  res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ── GET ME ────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    res.status(200).json({ success: true, data: userPayload(user) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};