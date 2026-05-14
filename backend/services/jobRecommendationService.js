/**
 * Job Recommendation Service
 * Matches job seekers with suitable jobs based on skill similarity using SBERT
 */

import { spawn } from 'child_process';
import path from 'path';
import { ResumeAnalysis } from '../models/resumeAnalysis.model.js';
import { JobAnalysis } from '../models/jobAnalysis.model.js';
import { Job } from '../models/job.model.js';
import { User } from '../models/user.model.js';
import { sendJobRecommendationEmail as sendEmailToUser } from '../utils/emailService.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_EXECUTABLE = 'C:\\Users\\aniru\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const SBERT_MATCHER = path.join(__dirname, '..', 'ml', 'sbert_skill_matcher.py');

class JobRecommendationService {
  /**
   * Match resume skills with job skills using SBERT
   * @param {Array} resumeSkills - Skills from resume
   * @param {Array} jobSkills - Skills from job
   * @param {Number} threshold - Similarity threshold (0-1)
   * @returns {Promise<Object>} Matching results
   */
  static async matchSkillsWithSBERT(resumeSkills, jobSkills, threshold = 0.5) {
    return new Promise((resolve) => {
      const pythonProcess = spawn(PYTHON_EXECUTABLE, [SBERT_MATCHER], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..')
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0 || !stdout) {
          console.error('SBERT matching error:', stderr);
          resolve({
            matches: [],
            match_percentage: 0,
            confidence: false,
            error: 'Skill matching failed'
          });
          return;
        }

        try {
          const lines = stdout.trim().split('\n').filter(l => l);
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (e) {
          console.error('Failed to parse SBERT output:', e.message);
          resolve({
            matches: [],
            match_percentage: 0,
            confidence: false,
            error: 'Parse error'
          });
        }
      });

      const input = {
        resume_skills: resumeSkills,
        job_skills: jobSkills,
        threshold: threshold
      };

      pythonProcess.stdin.write(JSON.stringify(input) + '\n');
      pythonProcess.stdin.end();
    });
  }

  /**
   * Find matching jobs for a user based on resume skills
   * @param {String} userId - User ID
   * @param {Number} threshold - Minimum match percentage (0-100)
   * @returns {Promise<Array>} Array of matching jobs with recommendations
   */
  static async findMatchingJobsForUser(userId, threshold = 50) {
    try {
      // Get user resume skills
      const resumeAnalysis = await ResumeAnalysis.findOne({ user: userId });
      if (!resumeAnalysis || !resumeAnalysis.extracted_skills || resumeAnalysis.extracted_skills.length === 0) {
        console.log(`No resume skills found for user ${userId}`);
        return [];
      }

      const userSkills = resumeAnalysis.extracted_skills;

      // Get all published jobs with extracted skills
      const jobsWithAnalysis = await JobAnalysis.find()
        .populate('job')
        .populate('company')
        .lean();

      const matches = [];

      // Match each job against user skills
      for (const jobAnalysis of jobsWithAnalysis) {
        const jobSkills = jobAnalysis.extractedSkills || [];

        // Skip if no skills extracted
        if (jobSkills.length === 0) continue;

        // Match skills using SBERT
        const matchResult = await this.matchSkillsWithSBERT(userSkills, jobSkills, 0.5);

        const matchPercentage = matchResult.match_percentage || 0;

        // Only include if match percentage meets threshold
        if (matchPercentage >= threshold) {
          matches.push({
            jobId: jobAnalysis.job._id,
            jobTitle: jobAnalysis.job.title,
            companyName: jobAnalysis.company.name,
            companyLogo: jobAnalysis.company.logo,
            location: jobAnalysis.job.location,
            salary: jobAnalysis.job.salary,
            description: jobAnalysis.job.description,
            matchPercentage: matchPercentage,
            matchedSkills: matchResult.matches,
            totalMatches: matchResult.total_matches || 0,
            missingSkills: matchResult.missing_job_skills || [],
            extractedJobSkills: jobSkills,
            extractedResumeSkills: userSkills
          });
        }
      }

      // Sort by match percentage (highest first)
      return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
    } catch (error) {
      console.error('Error finding matching jobs:', error);
      return [];
    }
  }

  /**
   * Send job recommendation email to user
   * @param {String} userId - User ID
   * @param {Array} matchedJobs - Array of matched jobs
   * @returns {Promise<Boolean>} Success status
   */
  static async sendJobRecommendationEmail(userId, matchedJobs) {
    try {
      if (!matchedJobs || matchedJobs.length === 0) {
        console.log(`No jobs to recommend for user ${userId}`);
        return false;
      }

      const user = await User.findById(userId);
      if (!user || !user.email) {
        console.log(`User email not found for ${userId}`);
        return false;
      }

      // Build email HTML
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const jobsHTML = matchedJobs
        .slice(0, 5) // Top 5 recommendations
        .map((job, idx) => `
          <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h3>${idx + 1}. ${job.jobTitle}</h3>
            <p><strong>Company:</strong> ${job.companyName}</p>
            <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
            <p><strong>Salary:</strong> ${job.salary ? `$${job.salary.toLocaleString()}` : 'Competitive'}</p>
            <p><strong>Match: ${job.matchPercentage}%</strong></p>
            <p><strong>Matched Skills:</strong> ${job.matchedSkills.slice(0, 3).map(m => m.resume_skill).join(', ')}</p>
            ${job.missingSkills.length > 0 ? `<p><strong>Skills to Learn:</strong> ${job.missingSkills.slice(0, 2).join(', ')}</p>` : ''}
            <p style="margin-top: 15px;">
              <a href="${frontendURL}/jobs/${job.jobId}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Job Details →</a>
            </p>
          </div>
        `)
        .join('');

      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { margin: 20px 0; }
            .job-card { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .job-card h3 { color: #667eea; margin: 0 0 10px 0; }
            .match-badge { display: inline-block; background: #4caf50; color: white; padding: 5px 10px; border-radius: 20px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            .cta-button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Job Recommendations for You</h1>
              <p>Based on your skills and experience</p>
            </div>

            <div class="content">
              <p>Hi ${user.fullname || 'Job Seeker'},</p>
              <p>We found <strong>${matchedJobs.length}</strong> job${matchedJobs.length > 1 ? 's' : ''} that match your skills! Here are your top recommendations:</p>

              <div style="margin: 20px 0;">
                ${jobsHTML}
              </div>

              <center>
                <a href="https://just-in-with-skills-parsing.vercel.app/" class="cta-button">View All Matching Jobs →</a>
              </center>

              <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
                <h3>💡 Tips:</h3>
                <ul>
                  <li>Review the job descriptions carefully</li>
                  <li>Highlight matching skills in your applications</li>
                  <li>Learn the missing skills to increase your match percentage</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p>This is an automated job recommendation from your Job Portal.</p>
              <p>&copy; ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email
      const emailResult = await sendEmailToUser(
        user.email,
        `🎯 ${matchedJobs.length} Job Recommendations Based on Your Skills`,
        matchedJobs,
        user.fullname || 'Job Seeker'
      );

      if (emailResult && emailResult.success) {
        console.log(`✅ Recommendation email sent to ${user.email}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending recommendation email:', error);
      return false;
    }
  }

  /**
   * Send recommendations to all eligible users for a new job
   * @param {String} jobId - Job ID
   * @returns {Promise<Object>} Result with count of emails sent
   */
  static async sendRecommendationsForNewJob(jobId) {
    try {
      // Get job analysis
      const jobAnalysis = await JobAnalysis.findOne({ job: jobId })
        .populate('job')
        .populate('company');

      if (!jobAnalysis || !jobAnalysis.extractedSkills) {
        console.log(`No skills extracted for job ${jobId}`);
        return { sent: 0, failed: 0, error: 'No skills extracted' };
      }

      const jobSkills = jobAnalysis.extractedSkills;

      // Get all users with resume analysis
      const usersWithResume = await ResumeAnalysis.find({ extracted_skills: { $exists: true, $ne: [] } })
        .distinct('user');

      let sentCount = 0;
      let failedCount = 0;

      // Match and email each user
      for (const userId of usersWithResume) {
        try {
          const resumeAnalysis = await ResumeAnalysis.findOne({ user: userId });
          if (!resumeAnalysis || !resumeAnalysis.extracted_skills) continue;

          const userSkills = resumeAnalysis.extracted_skills;

          // Match skills
          const matchResult = await this.matchSkillsWithSBERT(userSkills, jobSkills, 0.5);
          const matchPercentage = matchResult.match_percentage || 0;

          // Send if match >= 40%
          if (matchPercentage >= 40) {
            const job = await Job.findById(jobId).populate('company');
            const matchedJob = {
              jobId: job._id,
              jobTitle: job.title,
              companyName: job.company.name,
              companyLogo: job.company.logo,
              location: job.location,
              salary: job.salary,
              description: job.description,
              // matchPercentage,
              // matchedSkills: matchResult.matches,
              // missingSkills: matchResult.missing_job_skills,
              // extractedJobSkills: jobSkills,
              // extractedResumeSkills: userSkills
            };

            const emailSent = await this.sendJobRecommendationEmail(userId, [matchedJob]);
            if (emailSent) {
              sentCount++;
            } else {
              failedCount++;
            }
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
          failedCount++;
        }
      }

      return {
        sent: sentCount,
        failed: failedCount,
        total: sentCount + failedCount,
        jobId: jobId
      };
    } catch (error) {
      console.error('Error sending recommendations for job:', error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  /**
   * Run daily job recommendations for all users
   * Called by scheduler daily
   * @returns {Promise<Object>} Summary of recommendations sent
   */
  static async runDailyRecommendations() {
    try {
      console.log('🚀 Running daily job recommendations...');

      const usersWithResume = await ResumeAnalysis.find({
        extracted_skills: { $exists: true, $ne: [] }
      })
        .distinct('user')
        .lean();

      let totalEmailsSent = 0;
      const results = [];

      for (const userId of usersWithResume) {
        try {
          const matchedJobs = await this.findMatchingJobsForUser(userId, 50);

          if (matchedJobs.length > 0) {
            const emailSent = await this.sendJobRecommendationEmail(userId, matchedJobs);
            if (emailSent) {
              totalEmailsSent++;
              results.push({
                userId,
                jobsFound: matchedJobs.length,
                sent: true
              });
            }
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
        }
      }

      const summary = {
        timestamp: new Date(),
        totalUsersProcessed: usersWithResume.length,
        emailsSent: totalEmailsSent,
        successRate: ((totalEmailsSent / usersWithResume.length) * 100).toFixed(1) + '%',
        details: results
      };

      console.log(`✅ Daily recommendations complete: ${totalEmailsSent} emails sent`);
      return summary;
    } catch (error) {
      console.error('Error running daily recommendations:', error);
      return {
        timestamp: new Date(),
        error: error.message,
        emailsSent: 0
      };
    }
  }
}

export default JobRecommendationService;
