import { sendEmail, generateVerificationEmail } from './emailService';

async function testEmailDelivery() {
  console.log('Testing email delivery...');
  
  const testEmail = 'andrewkim822@gmail.com';
  const verificationUrl = 'http://localhost:5000/api/verify-email?token=test123';
  const emailHtml = generateVerificationEmail('TestUser', verificationUrl);
  
  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email - TrueCircle Verification',
      html: emailHtml
    });
    
    console.log('Email delivery result:', result);
  } catch (error) {
    console.error('Email test failed:', error);
  }
}

testEmailDelivery();