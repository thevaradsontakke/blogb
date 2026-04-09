import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n📧 Testing Email Configuration...\n');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (***' + process.env.EMAIL_PASS.slice(-4) + ')' : '❌ NOT SET');
console.log('\n---\n');

const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Sending test email...\n');

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: '✅ Test Email - VaradBuilds',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #2563eb;">✅ Email Configuration Successful!</h2>
      <p>If you're reading this, your email is working correctly.</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
  `,
  text: 'Email configuration test successful! Time: ' + new Date().toLocaleString()
}, (error, info) => {
  if (error) {
    console.error('❌ Email failed:', error.message);
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('\n💡 Solution:');
      console.log('1. Your App Password is incorrect or expired');
      console.log('2. Generate NEW App Password: https://myaccount.google.com/apppasswords');
      console.log('3. Update EMAIL_PASS in server/.env (remove spaces)');
      console.log('4. Run this test again\n');
    }
    process.exit(1);
  } else {
    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Check your inbox:', process.env.EMAIL_USER);
    console.log('\n🎉 Your email configuration is working!\n');
    process.exit(0);
  }
});
