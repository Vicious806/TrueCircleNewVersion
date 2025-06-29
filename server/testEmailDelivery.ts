import { sendEmail, generateVerificationEmail } from "./emailService";

async function testEmailDelivery() {
  try {
    console.log("Testing email delivery...");
    
    const testCode = "123456";
    const emailHtml = generateVerificationEmail("TestUser", testCode);
    
    const result = await sendEmail({
      to: "truecircle12@gmail.com", // Send to ourselves for testing
      subject: "TrueCircle Email Test - Delivery Check",
      html: emailHtml
    });
    
    console.log("Email delivery test result:", result);
    
    if (result) {
      console.log("✅ Email sent successfully!");
      console.log("Check the inbox for truecirclesocial@gmail.com");
    } else {
      console.log("❌ Email failed to send");
    }
    
  } catch (error) {
    console.error("Email test error:", error);
  }
}

testEmailDelivery();