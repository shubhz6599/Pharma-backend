import nodemailer from 'nodemailer';
import { logger } from './logger';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ,
    port: parseInt(process.env.SMTP_PORT || '587'),
    // secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
console.log('SMTP_HOST:', process.env.SMTP_HOST);

const FROM = process.env.SMTP_USER!;

export const sendOtpEmail = async (to: string, otp: string, purpose: 'verify' | 'reset'): Promise<void> => {
  const isVerify = purpose === 'verify';
  const subject  = isVerify ? 'Verify Your PharmaTrack Account' : 'Reset Your PharmaTrack Password';
  const heading  = isVerify ? 'Email Verification' : 'Password Reset';
  const bodyText = isVerify
    ? 'You recently registered on PharmaTrack Pro. Use the OTP below to verify your email address.'
    : 'You requested a password reset on PharmaTrack Pro. Use the OTP below to reset your password.';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c1117;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#131c27;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:500px;width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,#14b8a6,#0d9488);padding:28px 32px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">⚕</div>
            <h1 style="margin:0;color:#0c1117;font-size:20px;font-weight:800">PharmaTrack Pro</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 12px;color:#f0f4f8;font-size:18px">${heading}</h2>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6">${bodyText}</p>
            <div style="background:#1a2535;border:1px solid rgba(20,184,166,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.06em">Your OTP</p>
              <div style="font-size:36px;font-weight:800;color:#14b8a6;letter-spacing:0.25em;font-family:monospace">${otp}</div>
              <p style="margin:8px 0 0;color:#4e6480;font-size:12px">Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
            </div>
            <p style="margin:0;color:#4e6480;font-size:12px;line-height:1.6">
              If you did not request this, please ignore this email. Do not share this OTP with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
            <p style="margin:0;color:#4e6480;font-size:11px">© ${new Date().getFullYear()} PharmaTrack Pro. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    console.log('FROM:', FROM);
    await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`OTP email sent to ${to} for ${purpose}`);
  } catch (err) {
    logger.error(`Failed to send OTP email to ${to}:`, err);
    throw new Error('Failed to send OTP email. Please try again.');
  }
};