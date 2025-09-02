// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

// Get configuration from environment variables with defaults
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@example.com';
const NOTIFY_TO = process.env.NOTIFY_TO || ''; // Optional: your email to get notifications

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create email transporter using Brevo SMTP settings
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// Route: Home page with form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'form.html'));
});

// Route: Handle form submission
app.post('/submit', async (req, res) => {
  try {
    // Get form data
    const { name, email } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).send('Name and email are required');
    }
    
    // Email to the user (confirmation)
    const userMailOptions = {
      from: MAIL_FROM,
      to: email,
      subject: 'Thank you for your submission!',
      html: `
        <h2>Hello ${name}!</h2>
        <p>Thank you for submitting your information.</p>
        <p>We have received your email address: ${email}</p>
        <p>We'll be in touch soon!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
      `
    };
    
    // Send confirmation email to user
    await transporter.sendMail(userMailOptions);
    console.log(`Confirmation email sent to ${email}`);
    
    // Optional: Send notification to admin
    if (NOTIFY_TO) {
      const adminMailOptions = {
        from: MAIL_FROM,
        to: NOTIFY_TO,
        subject: 'New Form Submission',
        html: `
          <h2>New submission received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Submitted at:</strong> ${new Date().toISOString()}</p>
        `
      };
      
      await transporter.sendMail(adminMailOptions);
      console.log(`Notification sent to admin: ${NOTIFY_TO}`);
    }
    
    // Redirect to thank-you page
    res.redirect('/thank-you');
    
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Sorry, there was an error processing your request. Please try again later.');
  }
});

// Route: Thank you page
app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'thank-you.html'));
});

// Route: Health check endpoint
app.get('/healthz', (req, res) => {
  // Return 200 OK for health checks
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Health check available at http://${HOST}:${PORT}/healthz`);
  console.log('SMTP Configuration:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER ? 'Configured' : 'Not configured',
    from: MAIL_FROM
  });
});

// ===================================
