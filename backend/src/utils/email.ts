import nodemailer from 'nodemailer';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
    logger.warn('SMTP configuration incomplete. Email sending will be disabled.');
    // Create a mock transporter that logs instead of sending
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    } as any);
    return transporter;
  }

  transporter = nodemailer.createTransport(smtpConfig);
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  try {
    const emailTransporter = getTransporter();
    const from = process.env.EMAIL_FROM || 'noreply@btcwhalenotify.com';

    const info = await emailTransporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    logger.error('Failed to send email', error);
    throw error;
  }
}

export async function sendVerificationEmail(
  to: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${process.env.APP_URL}/verify?token=${verificationToken}`;
  const html = `
    <html>
      <body>
        <h2>Verify your email address</h2>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </body>
    </html>
  `;

  await sendEmail(to, 'Verify your email address', html);
}
