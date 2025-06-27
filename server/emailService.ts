import nodemailer from 'nodemailer';

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'truecirclesocial@gmail.com',
    pass: 'nvwp wbje monl glxk'
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: 'truecirclesocial@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateVerificationEmail(username: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - FriendMeet</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FriendMeet!</h1>
          <p>Social dining made simple</p>
        </div>
        <div class="content">
          <h2>Hi ${username},</h2>
          <p>Thanks for joining FriendMeet! We're excited to help you connect with fellow food lovers in your area.</p>
          
          <p>To complete your registration and start discovering amazing dining experiences, please verify your email address:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Email</a>
          </div>
          
          <p>Once verified, you can:</p>
          <ul>
            <li>Complete your personality survey for better matches</li>
            <li>Set your dining preferences (restaurants or cafes)</li>
            <li>Join Friday meetups at 1:00 PM or 5:30 PM</li>
            <li>Connect with compatible people in your age range</li>
          </ul>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
          
          <p><strong>Note:</strong> This verification link will expire in 24 hours for security reasons.</p>
        </div>
        <div class="footer">
          <p>If you didn't create this account, please ignore this email.</p>
          <p>© 2025 FriendMeet - Connecting food lovers everywhere</p>
        </div>
      </div>
    </body>
    </html>
  `;
}