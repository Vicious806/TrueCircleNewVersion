import nodemailer from 'nodemailer';

// Gmail transporter configuration with correct app password format
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'truecircle12@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'nvwp wbje monl glxk'
  },
  debug: true,
  logger: true
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Test the connection first
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions = {
      from: 'truecircle12@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: `Password reset code: ${options.html.match(/font-family: monospace;">([^<]+)</)?.[1] || 'Please check HTML version'}. This code expires in 15 minutes. If you did not request this reset, please ignore this email.`,
      headers: {
        'X-Priority': '3'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`, info.messageId);
    return true;
  } catch (error: any) {
    console.error('Email delivery failed:', error);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed - check Gmail app password');
    }
    return false;
  }
}

export function generatePasswordResetEmail(username: string, resetCode: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto;">
        <h2>Password Reset</h2>
        
        <p>Hello ${username},</p>
        
        <p>Please enter this reset code to create a new password:</p>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">${resetCode}</div>
        </div>
        
        <p>This code expires in 15 minutes.</p>
        
        <p>If you did not request this password reset, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from TrueCircle.<br>
          Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generateVerificationEmail(username: string, verificationCode: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto;">
        <h2>Email Verification</h2>
        
        <p>Hello ${username},</p>
        
        <p>Please enter this verification code to complete your account setup:</p>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">${verificationCode}</div>
        </div>
        
        <p>This code expires in 15 minutes.</p>
        
        <p>If you did not request this, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from TrueCircle.<br>
          Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}