import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (
    to: string,
    otp: string,
    purpose: 'verify' | 'reset'
): Promise<void> => {
    console.log('EMAIL_USER=', process.env.EMAIL_USER);
    console.log('EMAIL_APP_PASSWORD=', process.env.EMAIL_APP_PASSWORD?.length);
    const isVerify = purpose === 'verify';

    const subject = isVerify
        ? 'Verify Your PharmaTrack Account'
        : 'Reset Your PharmaTrack Password';

    const heading = isVerify
        ? 'Email Verification'
        : 'Password Reset';

    const bodyText = isVerify
        ? 'You recently registered on PharmaTrack Pro. Use the OTP below to verify your email address.'
        : 'You requested a password reset on PharmaTrack Pro. Use the OTP below to reset your password.';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>${heading}</h2>

      <p>${bodyText}</p>

      <div style="
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        text-align: center;
        margin: 30px 0;
      ">
        ${otp}
      </div>

      <p>This OTP will expire in 10 minutes.</p>

      <hr />

      <p>PharmaTrack Pro</p>
    </div>
  `;

    try {
        const info = await transporter.sendMail({
            from: `"PharmaTrack" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        logger.info(`Email sent successfully: ${info.messageId}`);
    } catch (error) {
        logger.error('Failed to send email:', error);
        throw new Error('Failed to send OTP email');
    }
};