import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if email configuration is available
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

console.log("=== EMAIL SERVICE DEBUG (Nodemailer + Gmail SMTP) ===");
console.log("EMAIL_HOST:", process.env.EMAIL_HOST ? "✅ Set" : "❌ Missing");
console.log("EMAIL_PORT:", process.env.EMAIL_PORT ? "✅ Set" : "❌ Missing");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Missing");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set (hidden)" : "❌ Missing");
console.log("EMAIL_SECURE:", process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE : "❌ Missing (default: false)");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("isEmailConfigured:", isEmailConfigured);

// Create a transporter object only if email is configured
let transporter = null;

if (isEmailConfigured) {
  try {
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailSecure = process.env.EMAIL_SECURE === 'true' || emailPort === 465;
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log("Creating transporter with:");
    console.log("  Host:", process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log("  Port:", emailPort);
    console.log("  Secure:", emailSecure);
    console.log("  Environment: ", isProduction ? "Production (Railway)" : "Development");
    
    // Railway-optimized transporter configuration
    // Key fixes for ETIMEDOUT on Railway:
    // 1. connectionTimeout: 10s - quickly fail if can't connect
    // 2. socketTimeout: 30s - timeout for data transfer
    // 3. maxConnections: 5 - connection pooling to reuse connections
    // 4. maxMessages: Infinity - send unlimited emails per connection
    // 5. rateDelta: 1000 - milliseconds between messages
    // 6. rateLimit: 5 - max 5 emails per rateDelta
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        // Additional TLS options for Railway compatibility
        minVersion: 'TLSv1.2'
      },
      // Connection pooling and timeout settings (Railway optimization)
      pool: {
        maxConnections: 5,        // Keep 5 connections in pool
        maxMessages: Infinity,     // Reuse connections for many emails
        rateDelta: 1000,          // Milliseconds between rate limit resets
        rateLimit: 5              // Max 5 emails per second
      },
      // Socket/connection timeout settings (prevent ETIMEDOUT)
      connectionTimeout: 10 * 1000,  // 10 seconds to connect (was infinite)
      socketTimeout: 30 * 1000,      // 30 seconds for data transfer (was infinite)
      // Additional options
      greetingTimeout: 30 * 1000,    // 30 seconds for SMTP greeting
      logger: isProduction ? true : false,  // Log SMTP transactions in production
      debug: !isProduction,           // Debug mode in development only
      authMethod: 'LOGIN'             // Use LOGIN auth method (more compatible)
    });

    // Verify transporter configuration asynchronously (don't block server startup)
    // This happens in background after server starts
    setImmediate(() => {
      transporter.verify()
        .then(success => {
          console.log('✅ SMTP server connection successful, ready to send emails');
        })
        .catch(error => {
          console.error('⚠️ SMTP server connection error on startup:', error.message);
          console.log('   Error Code:', error.code);
          console.log('   Email will still be attempted when needed');
          console.log('   Common fixes:');
          console.log('   - Ensure EMAIL_USER and EMAIL_PASS are Gmail App Password (not regular password)');
          console.log('   - Verify no 2-factor authentication is blocking SMTP');
          console.log('   - Check Railway dashboard for EMAIL_* environment variables');
        });
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
 * Helper function: Send email with retry logic
 * Retries up to 3 times if connection fails (Railway optimization)
 * @param {Object} mailOptions - Email options for transporter.sendMail()
 * @param {Number} retryCount - Current retry attempt (internal)
 * @returns {Promise} - Email send result or error
 */
const sendMailWithRetry = async (mailOptions, retryCount = 0) => {
  const MAX_RETRIES = 2;  // Total attempts = 3 (initial + 2 retries)
  const RETRY_DELAY = 2000;  // 2 seconds between retries
  
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (error) {
    // Determine if error is retryable
    const isRetryable = error.code === 'ETIMEDOUT' || 
                       error.code === 'ECONNREFUSED' || 
                       error.code === 'ECONNRESET' ||
                       error.message?.includes('timeout') ||
                       error.message?.includes('TIMEOUT');
    
    if (isRetryable && retryCount < MAX_RETRIES) {
      console.warn(`⚠️ Email send failed (${error.code}), retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      // Recursive retry
      return sendMailWithRetry(mailOptions, retryCount + 1);
    }
    
    // Non-retryable error or max retries reached
    return { success: false, error };
  }
};

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

    // Prepare mail options
    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    // Send mail with retry logic (handles ETIMEDOUT on Railway)
    console.log(`📧 Attempting to send email to ${to} with subject: "${subject}"`);
    console.log(`   From: ${process.env.EMAIL_USER}`);
    
    const result = await sendMailWithRetry(mailOptions);

    if (result.success) {
      console.log(`✅ Email sent successfully!`);
      console.log(`   Message ID: ${result.data.messageId}`);
      console.log(`   To: ${to}`);
      return { success: true, messageId: result.data.messageId };
    } else {
      // Retry failed, return error
      const errorMsg = result.error?.message || 'Unknown error';
      const errorCode = result.error?.code || 'UNKNOWN';
      console.error('❌ Error sending email after retries:', errorMsg);
      console.error('   Error code:', errorCode);
      
      return { 
        error: errorMsg, 
        success: false,
        details: errorCode === 'EAUTH' ? 'Authentication failed. Check your email credentials (use Gmail App Password).' : errorCode,
        code: errorCode
      };
    }
  } catch (error) {
    console.error('❌ Unexpected error sending email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', error);
    // Return error object instead of throwing to prevent crashes
    return { 
      error: error.message, 
      success: false,
      details: error.code === 'EAUTH' ? 'Authentication failed. Check your email credentials (use Gmail App Password).' : error.code,
      code: error.code
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
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const jobId = job.jobId || job._id || '';
    
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
          <p style="margin: 15px 0 0 0;">
            <a href="${frontendURL}/jobs/${jobId}" style="background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Full Details →</a>
          </p>
        </div>
        
        <p>Visit our platform to apply for this position!</p>
        <p>Best regards,<br>The Job Portal Team</p>
      </div>
    `;

    // Prepare mail options
    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    // Send mail with retry logic
    console.log(`📧 Attempting to send new job notification to ${to} with subject: "${subject}"`);
    
    const result = await sendMailWithRetry(mailOptions);

    if (result.success) {
      console.log(`✅ New job notification email sent successfully!`);
      console.log(`   Message ID: ${result.data.messageId}`);
      console.log(`   To: ${to}`);
      return { success: true, messageId: result.data.messageId };
    } else {
      // Retry failed
      const errorMsg = result.error?.message || 'Unknown error';
      const errorCode = result.error?.code || 'UNKNOWN';
      console.error('❌ Error sending new job notification after retries:', errorMsg);
      console.error('   Error code:', errorCode);
      
      return { 
        error: errorMsg, 
        success: false,
        details: errorCode === 'EAUTH' ? 'Authentication failed. Check your email credentials.' : errorCode,
        code: errorCode
      };
    }
  } catch (error) {
    console.error('❌ Unexpected error sending new job notification:', error.message);
    console.error('   Error code:', error.code);
    // Return error object instead of throwing to prevent crashes
    return { 
      error: error.message, 
      success: false,
      details: error.code === 'EAUTH' ? 'Authentication failed. Check your email credentials.' : error.code,
      code: error.code
    };
  }
};


