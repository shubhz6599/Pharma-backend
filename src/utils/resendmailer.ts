import { Resend } from 'resend';
import { logger } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (
  to: string,
  otp: string,
  purpose: 'verify' | 'reset'
): Promise<void> => {

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
    const { data, error } = await resend.emails.send({
      from: 'PharmaTrack <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      logger.error(JSON.stringify(error));
      throw new Error(error.message);
    }

    logger.info(`Email sent successfully. ID: ${data?.id}`);

  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send OTP email');
  }
};