import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { sendJobRecommendationEmail, sendNewJobNotificationEmail } from '../utils/emailService.js';

/**
 * Calculate the match score between user skills and job requirements
 * @param {Array} userSkills - Array of user skills
 * @param {Array} jobRequirements - Array of job requirements
 * @returns {Object} - Object containing match score and matching skills
 */
const calculateMatchScore = (userSkills, jobRequirements) => {
  // Convert all skills to lowercase for case-insensitive comparison
  const normalizedUserSkills = userSkills.map(skill => skill.toLowerCase().trim());
  const normalizedJobRequirements = jobRequirements.map(req => req.toLowerCase().trim());
  
  // Find matching skills
  const matchingSkills = normalizedUserSkills.filter(skill => 
    normalizedJobRequirements.some(req => req.includes(skill) || skill.includes(req))
  );
  
  // Calculate match score as percentage
  const matchScore = jobRequirements.length > 0 
    ? (matchingSkills.length / jobRequirements.length) * 100 
    : 0;
  
  return {
    score: matchScore,
    matchingSkills
  };
};

/**
 * Find matching jobs for a specific user
 * @param {Object} user - User object with skills
 * @param {Number} minMatchPercentage - Minimum match percentage (default: 30%)
 * @returns {Array} - Array of matching job objects with scores
 */
export const findMatchingJobsForUser = async (user, minMatchPercentage = 30) => {
  try {
    // Ensure user has skills
    if (!user.profile?.skills || user.profile.skills.length === 0) {
      return [];
    }
    
    // Get all active jobs
    const allJobs = await Job.find({}).populate('company');
    
    // Calculate match scores for each job
    const matchingJobs = allJobs.map(job => {
      const { score, matchingSkills } = calculateMatchScore(user.profile.skills, job.requirements);
      
      return {
        job,
        score,
        matchingSkills
      };
    })
    // Filter jobs that meet the minimum match percentage
    .filter(match => match.score >= minMatchPercentage)
    // Sort by match score (highest first)
    .sort((a, b) => b.score - a.score);
    
    return matchingJobs;
  } catch (error) {
    console.error('Error finding matching jobs:', error);
    throw error;
  }
};

/**
 * Find users matching a specific job
 * @param {Object} job - Job object with requirements
 * @param {Number} minMatchPercentage - Minimum match percentage (default: 30%)
 * @returns {Array} - Array of matching user objects with scores
 */
export const findUsersMatchingJob = async (job, minMatchPercentage = 30) => {
  try {
    // Ensure job has requirements
    if (!job.requirements || job.requirements.length === 0) {
      return [];
    }
    
    // Get all users with skills
    const allUsers = await User.find({ 
      'profile.skills': { $exists: true, $ne: [] },
      'role': 'student' // Only match job seekers, not recruiters
    });
    
    // Calculate match scores for each user
    const matchingUsers = allUsers.map(user => {
      const { score, matchingSkills } = calculateMatchScore(
        user.profile?.skills || [], 
        job.requirements
      );
      
      return {
        user,
        score,
        matchingSkills
      };
    })
    // Filter users that meet the minimum match percentage
    .filter(match => match.score >= minMatchPercentage)
    // Sort by match score (highest first)
    .sort((a, b) => b.score - a.score);
    
    return matchingUsers;
  } catch (error) {
    console.error('Error finding matching users:', error);
    throw error;
  }
};

/**
 * Send job recommendations to a specific user
 * @param {String} userId - User ID
 * @returns {Promise} - Promise resolving when emails are sent
 */
export const sendJobRecommendationsToUser = async (userId) => {
  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    // Find matching jobs for this user
    const matchingJobs = await findMatchingJobsForUser(user);
    
    // If there are matching jobs, send email
    if (matchingJobs.length > 0) {
      // Extract just the job objects from the matching results
      const jobs = matchingJobs.map(match => match.job);
      
      // Send email with job recommendations
      const emailResult = await sendJobRecommendationEmail(
        user.email,
        'Job Recommendations Based on Your Skills',
        jobs,
        user.fullname
      );
      
      if (!emailResult.success) {
        console.warn(`Failed to send job recommendations to ${user.email}:`, emailResult.error);
        return {
          success: false,
          message: `Failed to send job recommendations to ${user.email}: ${emailResult.error}`,
          error: emailResult
        };
      }
      
      return {
        success: true,
        message: `Sent ${matchingJobs.length} job recommendations to ${user.email}`
      };
    }
    
    return {
      success: true,
      message: 'No matching jobs found for this user'
    };
  } catch (error) {
    console.error('Error sending job recommendations:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Send job recommendations to all users
 * @returns {Promise} - Promise resolving when all emails are sent
 */
export const sendJobRecommendationsToAllUsers = async () => {
  try {
    // Find all users with skills
    const users = await User.find({ 
      'profile.skills': { $exists: true, $ne: [] },
      'role': 'student' // Only send to job seekers, not recruiters
    });
    
    console.log(`Sending job recommendations to ${users.length} users`);
    
    // Process each user
    const results = await Promise.all(
      users.map(user => sendJobRecommendationsToUser(user._id))
    );
    
    return {
      success: true,
      message: `Processed job recommendations for ${users.length} users`,
      results
    };
  } catch (error) {
    console.error('Error sending job recommendations to all users:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Notify matching users about a new job
 * @param {Object} job - Newly created job
 * @returns {Promise} - Promise resolving when all notifications are sent
 */
export const notifyUsersAboutNewJob = async (jobId) => {
  try {
    // Find job by ID and populate company details
    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      throw new Error(`Job not found with ID: ${jobId}`);
    }
    
    // Find users matching this job
    const matchingUsers = await findUsersMatchingJob(job);
    
    console.log(`Found ${matchingUsers.length} users matching new job: ${job.title}`);
    
    // Send email notifications to matching users
    const emailPromises = matchingUsers.map(async ({ user }) => {
      const emailResult = await sendNewJobNotificationEmail(
        user.email,
        job,
        user.fullname
      );
      
      if (!emailResult.success) {
        console.warn(`Failed to send new job notification to ${user.email}:`, emailResult.error);
      }
      
      return {
        userId: user._id,
        email: user.email,
        success: emailResult.success,
        error: emailResult.success ? null : emailResult.error,
        details: emailResult.details
      };
    });
    
    const results = await Promise.all(emailPromises);
    
    return {
      success: true,
      message: `Notified ${matchingUsers.length} users about new job`,
      results
    };
  } catch (error) {
    console.error('Error notifying users about new job:', error);
    return {
      success: false,
      message: error.message
    };
  }
};