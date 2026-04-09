import { createTransport } from 'nodemailer';
import { pool } from '../config/database.js';

// Input validation function
const validateContactInput = (name, email, phone, city, age) => {
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    errors.push('Valid phone number is required');
  }

  if (!city || city.trim().length < 2) {
    errors.push('City is required and must be at least 2 characters long');
  }

  if (!age || age < 18 || age > 100) {
    errors.push('Age is required and must be between 18 and 100');
  }
  
  // Sanitize inputs
  const sanitizedName = name?.trim().substring(0, 100);
  const sanitizedEmail = email?.trim().toLowerCase().substring(0, 100);
  const sanitizedPhone = phone?.trim().substring(0, 20);
  const sanitizedCity = city?.trim().substring(0, 100);
  const sanitizedAge = parseInt(age);
  
  return { errors, sanitizedName, sanitizedEmail, sanitizedPhone, sanitizedCity, sanitizedAge };
};

const submitContact = async (req, res) => {
  const { name, email, phone, city, age } = req.body;

  // Validate input
  const { errors, sanitizedName, sanitizedEmail, sanitizedPhone, sanitizedCity, sanitizedAge } = 
    validateContactInput(name, email, phone, city, age);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  const client = await pool.connect();
  
  try {
    // Check if email already exists
    const checkResult = await client.query(
      'SELECT id FROM leads WHERE email = $1',
      [sanitizedEmail]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in our system',
      });
    }

    // Insert new lead with city and age
    const insertResult = await client.query(
      'INSERT INTO leads (name, email, phone, city, age) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [sanitizedName, sanitizedEmail, sanitizedPhone, sanitizedCity, sanitizedAge]
    );

    const leadId = insertResult.rows[0].id;
    console.log(`✅ Lead saved with ID: ${leadId}`);

    // Try to send email notifications (non-blocking)
    try {
      // Send notification to admin
      await sendEmailNotification(sanitizedName, sanitizedEmail, sanitizedPhone, sanitizedCity, sanitizedAge);
      
      // Send confirmation email to lead
      await sendConfirmationEmail(sanitizedName, sanitizedEmail);
      
      return res.json({
        success: true,
        message: 'Contact form submitted successfully! Check your email for confirmation.',
        leadId: leadId
      });
    } catch (emailErr) {
      console.error('❌ Email Error:', emailErr.message);
      
      // Lead was saved successfully even if email failed
      return res.status(207).json({
        success: true,
        message: 'Lead saved successfully, but notification email failed to send.',
        leadId: leadId,
        warning: 'Email notification failed'
      });
    }
  } catch (err) {
    console.error('❌ Database Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error processing your request',
    });
  } finally {
    client.release();
  }
};

const sendEmailNotification = async (name, email, phone, city, age) => {
  // Check if email configuration exists
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing');
  }

  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER,
    subject: 'New Lead - VaradBuilds',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Lead Generated - VaradBuilds</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Age:</strong> ${age}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `,
    text: `
New Lead Generated - VaradBuilds
Name: ${name}
Email: ${email}
Phone: ${phone}
City: ${city}
Age: ${age}
Date: ${new Date().toLocaleString()}
    `
  };

  // Add timeout for email sending
  const emailPromise = transporter.sendMail(mailOptions);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email timeout after 10 seconds')), 10000);
  });

  await Promise.race([emailPromise, timeoutPromise]);
  console.log('📧 Email notification sent successfully');
};

// Send confirmation email to the lead
const sendConfirmationEmail = async (name, email) => {
  // Check if email configuration exists
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing');
  }

  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thank You for Contacting VaradBuilds! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e3a8a, #2563eb); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to VaradBuilds! 🎉</h1>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hi <strong>${name}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for reaching out to us! We've received your inquiry and our team will get back to you within 24 hours.
          </p>
          
          <div style="background: #f0f9ff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #1e3a8a; margin-top: 0;">What's Next?</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Our team will review your information</li>
              <li>We'll contact you via email or phone within 24 hours</li>
              <li>Get ready to start your digital skills journey!</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            In the meantime, feel free to explore our courses and resources:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://digitalvarad.vercel.com/products" style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Explore Our Courses
            </a>
          </div>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Need immediate assistance?</strong><br>
              📧 Email: <a href="mailto:sontakkevarad210@gmail.com" style="color: #2563eb;">sontakkevarad210@gmail.com</a><br>
              📱 WhatsApp: <a href="https://wa.me/919049671938" style="color: #2563eb;">+91 9049671938</a>
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
            Best regards,<br>
            <strong style="color: #2563eb;">Varad Mahadev Sontakke</strong><br>
            Founder, VaradBuilds
          </p>
        </div>
        
        <p style="text-align: center; color: white; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} VaradBuilds. All rights reserved.
        </p>
      </div>
    `,
    text: `
Hi ${name},

Thank you for contacting VaradBuilds!

We've received your inquiry and our team will get back to you within 24 hours.

What's Next?
- Our team will review your information
- We'll contact you via email or phone within 24 hours
- Get ready to start your digital skills journey!

Need immediate assistance?
Email: sontakkevarad210@gmail.com
WhatsApp: +91 9049671938

Best regards,
Varad Mahadev Sontakke
Founder, VaradBuilds

© ${new Date().getFullYear()} VaradBuilds. All rights reserved.
    `
  };

  // Add timeout for email sending
  const emailPromise = transporter.sendMail(mailOptions);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email timeout after 10 seconds')), 10000);
  });

  await Promise.race([emailPromise, timeoutPromise]);
  console.log('📧 Confirmation email sent to lead successfully');
};

export { submitContact };
