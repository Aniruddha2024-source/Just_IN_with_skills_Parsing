import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if email configuration is available
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

console.log("=== EMAIL SERVICE DEBUG ===");
console.log("EMAIL_HOST:", process.env.EMAIL_HOST ? "✅ Set" : "❌ Missing");
console.log("EMAIL_PORT:", process.env.EMAIL_PORT ? "✅ Set" : "❌ Missing");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Missing");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set (hidden)" : "❌ Missing");
console.log("EMAIL_SECURE:", process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE : "❌ Missing (default: false)");
console.log("isEmailConfigured:", isEmailConfigured);

// Create a transporter object only if email is configured
let transporter = null;

if (isEmailConfigured) {
  try {
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailSecure = process.env.EMAIL_SECURE === 'true' || emailPort === 465;
    
    console.log("Creating transporter with:");
    console.log("  Host:", process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log("  Port:", emailPort);
    console.log("  Secure:", emailSecure);
    
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration asynchronously
    transporter.verify()
      .then(success => {
        console.log('✅ SMTP server connection successful, ready to send emails');
      })
      .catch(error => {
        console.error('⚠️ SMTP server connection error:', error.message);
        console.log('Email will still be attempted, but may fail if credentials are invalid');
        console.log('For Gmail, make sure you are using an App Password');
      });
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    console.log('Email functionality will be disabled');
    transporter = null;
  }
} else {
  console.log('⚠️ Email configuration not found (missing EMAIL_USER or EMAIL_PASS). Email functionality will be disabled.');
  console.log('Please set EMAIL_USER and EMAIL_PASS environment variables on Railway Dashboard');
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
    console.log('⚠️ Email functionality is disabled. Skipping job recommendation email to', to);
    return { 
      success: false, 
      error: 'Email functionality is disabled', 
      details: 'Email service not configured properly'
    };
  }

  try {
    if (!Array.isArray(matchingJobs) || matchingJobs.length === 0) {
      console.log('⚠️ No matching jobs to send in email');
      return {
        success: false,
        error: 'No matching jobs provided',
        details: 'Array is empty or invalid'
      };
    }

    if (!to || !subject) {
      console.log('⚠️ Missing required email parameters (to, subject)');
      return {
        success: false,
        error: 'Missing required parameters',
        details: 'to and subject are required'
      };
    }

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    console.log(`📧 Preparing email for ${to} with ${matchingJobs.length} jobs`);
    console.log(`   Frontend URL: ${frontendURL}`);
    
    // Create HTML content for the email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">🎯 Job Recommendations for You</h1>
          <p style="margin: 5px 0 0 0;">Based on your skills and experience</p>
        </div>

        <p>Hi ${userName || 'Job Seeker'},</p>
        <p>We found <strong>${matchingJobs.length}</strong> job${matchingJobs.length > 1 ? 's' : ''} that match your skills! Here are your top recommendations:</p>
        
        ${matchingJobs.map((job, idx) => {
          const jobTitle = job.jobTitle || job.title || 'Job Title';
          const companyName = job.companyName || job.company?.name || 'Company';
          const location = job.location || 'Not specified';
          const salary = job.salary ? '$' + job.salary.toLocaleString() : 'Competitive';
          const jobId = job.jobId || job._id || '';

          return `
            <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">${idx + 1}. ${jobTitle}</h3>
              <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
              <p style="margin: 5px 0;"><strong>Salary:</strong> ${salary}</p>
              <p style="margin: 15px 0 0 0;">
                <a href="${frontendURL}/jobs/${jobId}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Job Details →</a>
              </p>
            </div>
          `;
        }).join('')}
        
        <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
          <h3 style="margin-top: 0;">💡 Tips:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Review the job descriptions carefully</li>
            <li>Apply to jobs that interest you</li>
            <li>Highlight relevant skills in your applications</li>
          </ul>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center;">
          <p style="margin: 5px 0;">This is an automated job recommendation from your Job Portal.</p>
          <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send mail with defined transport object
    console.log(`📧 Attempting to send email to ${to} with subject: "${subject}"`);
    console.log(`   From: ${process.env.EMAIL_USER}`);
    
    const info = await transporter.sendMail({
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', error);
    // Return error object instead of throwing to prevent crashes
    return { 
      error: error.message, 
      success: false,
      details: error.code === 'EAUTH' ? 'Authentication failed. Check your email credentials (use Gmail App Password).' : error.code 
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


