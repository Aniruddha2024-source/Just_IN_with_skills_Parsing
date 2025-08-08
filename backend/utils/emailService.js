import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if email configuration is available
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

// Create a transporter object only if email is configured
let transporter = null;

if (isEmailConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true' ? true : false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('SMTP server connection error:', error);
        console.log('Please check your EMAIL_USER and EMAIL_PASS environment variables');
        console.log('For Gmail, make sure you are using an App Password, not your regular password');
        console.log('Email functionality will be disabled');
        transporter = null;
      } else {
        console.log('SMTP server connection successful, ready to send emails');
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    console.log('Email functionality will be disabled');
    transporter = null;
  }
} else {
  console.log('Email configuration not found. Email functionality will be disabled.');
}

/**
 * Send an email with job recommendations
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {Array} matchingJobs - Array of matching job objects
 * @param {string} userName - Name of the recipient
 * @returns {Promise} - Promise resolving to the email sending result
 */
export const sendJobRecommendationEmail = async (to, subject, matchingJobs, userName) => {
  // Check if email functionality is available
  if (!transporter) {
    console.log('Email functionality is disabled. Skipping job recommendation email to', to);
    return { 
      success: false, 
      error: 'Email functionality is disabled', 
      details: 'Email service not configured properly'
    };
  }

  try {
    // Create HTML content for the email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a4a4a;">Hello ${userName},</h2>
        <p>We found ${matchingJobs.length} job(s) that match your skills:</p>
        
        ${matchingJobs.map(job => `
          <div style="margin-bottom: 20px; padding: 15px; border-radius: 5px; background-color: #f9f9f9; border-left: 4px solid #3498db;">
            <h3 style="margin-top: 0; color: #3498db;">${job.title}</h3>
            <p><strong>Company:</strong> ${job.company?.name || 'Not specified'}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Salary:</strong> $${job.salary}</p>
            <p><strong>Job Type:</strong> ${job.jobType}</p>
            <p><strong>Required Skills:</strong> ${job.requirements.join(', ')}</p>
            <p><strong>Description:</strong> ${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}</p>
          </div>
        `).join('')}
        
        <p>Visit our platform to apply for these positions!</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `;

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // Return error object instead of throwing to prevent crashes
    return { 
      error: error.message, 
      success: false,
      details: error.code === 'EAUTH' ? 'Authentication failed. Check your email credentials.' : error.code 
    };
  }
};

/**
 * Send an email notification about a new job posting
 * @param {string} to - Recipient email address
 * @param {Object} job - Job object with details
 * @param {string} userName - Name of the recipient
 * @returns {Promise} - Promise resolving to the email sending result
 */
export const sendNewJobNotificationEmail = async (to, job, userName) => {
  // Check if email functionality is available
  if (!transporter) {
    console.log('Email functionality is disabled. Skipping new job notification email to', to);
    return { 
      success: false, 
      error: 'Email functionality is disabled', 
      details: 'Email service not configured properly'
    };
  }

  try {
    const subject = `New Job Opportunity: ${job.title}`;
    
    // Create HTML content for the email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a4a4a;">Hello ${userName},</h2>
        <p>We found a new job posting that matches your skills!</p>
        
        <div style="margin-bottom: 20px; padding: 15px; border-radius: 5px; background-color: #f9f9f9; border-left: 4px solid #3498db;">
          <h3 style="margin-top: 0; color: #3498db;">${job.title}</h3>
          <p><strong>Company:</strong> ${job.company?.name || 'Not specified'}</p>
          <p><strong>Location:</strong> ${job.location}</p>
          <p><strong>Salary:</strong> $${job.salary}</p>
          <p><strong>Job Type:</strong> ${job.jobType}</p>
          <p><strong>Required Skills:</strong> ${job.requirements.join(', ')}</p>
          <p><strong>Description:</strong> ${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}</p>
        </div>
        
        <p>Visit our platform to apply for this position!</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `;

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`New job notification email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending new job notification email:', error);
    // Return error object instead of throwing to prevent crashes
    return { 
      error: error.message, 
      success: false,
      details: error.code === 'EAUTH' ? 'Authentication failed. Check your email credentials.' : error.code 
    };
  }
};