import nodemailer from 'nodemailer';

// Gmail transporter configuration with correct app password format
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'truecirclesocial@gmail.com',
    pass: 'nvwp wbje monl glxk'
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
      from: '"FriendMeet" <truecirclesocial@gmail.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: `Hi there! Welcome to FriendMeet! Please verify your email address to complete your registration and start connecting with fellow food lovers. Visit: ${options.html.match(/href="([^"]+)"/)?.[1] || 'verification link in HTML'}`,
      headers: {
        'X-Mailer': 'FriendMeet',
        'X-Priority': '3',
        'List-Unsubscribe': '<mailto:truecirclesocial@gmail.com?subject=unsubscribe>',
        'Reply-To': 'truecirclesocial@gmail.com'
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

export function generateVerificationEmail(username: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - FriendMeet</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #2563eb; color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 28px; }
        .header p { margin: 0; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .button { display: inline-block; background: #2563eb; color: white !important; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; transition: background-color 0.3s; }
        .button:hover { background: #1d4ed8; }
        .features { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .features ul { margin: 0; padding-left: 20px; }
        .features li { margin: 8px 0; }
        .url-box { background: #f1f5f9; padding: 15px; border-radius: 6px; word-break: break-all; color: #2563eb; font-family: monospace; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 5px 0; }
        @media (max-width: 600px) {
          .container { margin: 0; }
          .header, .content, .footer { padding: 25px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FriendMeet!</h1>
          <p>Your social dining journey starts here</p>
        </div>
        <div class="content">
          <h2>Hi ${username}!</h2>
          <p>Thank you for joining FriendMeet. We're thrilled to help you discover amazing dining experiences and connect with fellow food enthusiasts.</p>
          
          <p>To activate your account and start exploring, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <div class="features">
            <p><strong>What's waiting for you:</strong></p>
            <ul>
              <li>Smart matching based on your dining preferences</li>
              <li>Weekend meetups at restaurants and cafes</li>
              <li>Connect with people in your age range</li>
              <li>Anonymous group coordination for safety</li>
            </ul>
          </div>
          
          <p>Having trouble with the button? Copy and paste this link into your browser:</p>
          <div class="url-box">${verificationUrl}</div>
          
          <p><strong>Security note:</strong> This link expires in 24 hours to keep your account secure.</p>
        </div>
        <div class="footer">
          <p>Didn't sign up for FriendMeet? You can safely ignore this email.</p>
          <p>© 2025 FriendMeet • Bringing food lovers together</p>
          <p>This email was sent to verify your account registration.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}