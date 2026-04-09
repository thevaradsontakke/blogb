import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('\n📧 Testing Email Configuration...\n');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (***' + process.env.EMAIL_PASS.slice(-4) + ')' : '❌ NOT SET');
  console.log('NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL || '❌ NOT SET');
  console.log('\n---\n');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Error: EMAIL_USER or EMAIL_PASS not set in .env file');
    console.log('\n💡 Solution:');
    console.log('1. Generate Gmail App Password: https://myaccount.google.com/apppasswords');
    console.log('2. Update server/.env with your credentials');
    console.log('3. Run this test again\n');
    process.exit(1);
  }
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log('Sending test email...');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '✅ Test Email - VaradBuilds Email Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">✅ Email Configuration Successful!</h2>
          <p>If you're reading this, your email configuration is working correctly.</p>
          <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>Email User: ${process.env.EMAIL_USER}</li>
              <li>Service: Gmail</li>
              <li>Status: ✅ Working</li>
            </ul>
          </div>
          <p>Your contact form emails will now be sent successfully!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            This is a test email from VaradBuilds server.<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `
✅ Email Configuration Successful!

If you're reading this, your email configuration is working correctly.

Configuration Details:
- Email User: ${process.env.EMAIL_USER}
- Service: Gmail
- Status: ✅ Working

Your contact form emails will now be sent successfully!

This is a test email from VaradBuilds server.
Time: ${new Date().toLocaleString()}
      `
    });
    
    console.log('\n✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Check your inbox:', process.env.EMAIL_USER);
    console.log('\n🎉 Your email configuration is working!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Email failed:', error.message);
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('\n💡 Solution:');
      console.log('1. You MUST use Gmail App Password (not regular password)');
      console.log('2. Enable 2-Factor Authentication first');
      console.log('3. Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('4. Update EMAIL_PASS in server/.env (remove all spaces)');
      console.log('5. Run this test again');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Solution:');
      console.log('1. Check your internet connection');
      console.log('2. Make sure Gmail is not blocked by firewall');
    }
    
    console.log('\n📖 See FIX_EMAIL_ERROR.md for detailed instructions\n');
    process.exit(1);
  }
}

testEmail();
