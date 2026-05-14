import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { sendJobRecommendationEmail, sendNewJobNotificationEmail } from '../utils/emailService.js';
import { spawn } from 'child_process';
import path from 'path';

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
    const userSkills = user.profile?.skills || [];
    if (userSkills.length === 0) {
      console.log('User has no skills, returning empty matches');
      return [];
    }

    // Get all active jobs
    const allJobs = await Job.find({}).populate('company');
    if (!allJobs || allJobs.length === 0) {
      return [];
    }

    try {
      // Use SBERT matcher with resume skills (semantic skill matching)
      console.log(`Calling SBERT matcher for user with ${userSkills.length} skills against ${allJobs.length} jobs`);
      const sbertMatches = await callPythonMatcher(userSkills, allJobs, 50);
      
      console.log('SBERT matcher returned', Array.isArray(sbertMatches) ? sbertMatches.length : 0, 'matches');
      if (sbertMatches && sbertMatches.length > 0) {
        // Log SBERT results for debugging
        try { console.debug('SBERT matches sample:', JSON.stringify(sbertMatches.slice(0, 5).map(m => ({ title: m.title, matchPercentage: m.matchPercentage })))); } catch(e){}
        
        // Map SBERT results to job objects with match percentages
        const mapped = sbertMatches.map(m => {
          const job = allJobs.find(j => String(j._id) === String(m.jobId));
          return {
            job,
            score: m.matchPercentage || ((m.score || 0) * 100), // Use match percentage or convert score to percentage
            matchingSkills: m.matches || [],
            totalMatches: m.totalMatches || 0
          };
        }).filter(x => x.job);

        // Filter jobs that meet the minimum match percentage
        const filtered = mapped.filter(match => match.score >= minMatchPercentage)
          .sort((a, b) => b.score - a.score);

        if (filtered.length === 0) {
          console.log(`No SBERT matches passed the minMatchPercentage=${minMatchPercentage}. Top mapped results:`, mapped.slice(0, 5).map(m => ({ title: m.job?.title, score: m.score })));
        }

        return filtered;
      }
    } catch (err) {
      console.warn('SBERT matcher failed, falling back to JS matching:', err.message || err);
      // fall through to JS matching
    }

    // Fallback: Calculate match scores for each job using JavaScript matching
    console.log('Using fallback JS matching logic');
    const matchingJobs = allJobs.map(job => {
      const { score, matchingSkills } = calculateMatchScore(userSkills, job.requirements);

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
 * Call the Python SBERT Skill Matcher (backend/ml/sbert_skill_matcher.py) via stdin/stdout.
 * Matches resume skills with job requirements using semantic similarity.
 * Input: resume_skills (array), jobs (array of job objects with requirements)
 * Returns array of jobs ranked by skill match percentage.
 */
const callPythonMatcher = (resumeSkills = [], jobs, top_n = 10) => {
  return new Promise((resolve, reject) => {
    try {
  // Resolve script path from process.cwd(). If server is started from backend/ folder,
  // process.cwd() already points to backend, so use 'ml/sbert_skill_matcher.py' relative to CWD.
  const scriptPath = path.normalize(path.join(process.cwd(), 'ml', 'sbert_skill_matcher.py'));
  console.log('Calling SBERT matcher at', scriptPath);

  const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (data) => { stdout += data.toString(); });
      py.stderr.on('data', (data) => { stderr += data.toString(); });

      py.on('error', (err) => {
        reject(err);
      });

      py.on('close', (code) => {
        if (code !== 0) {
          // If script printed JSON error on stdout, attempt to parse it
          try {
            const parsed = JSON.parse(stdout || '{}');
            if (parsed && parsed.error) {
              return reject(new Error(parsed.error + (stderr ? `; stderr: ${stderr}` : '')));
            }
          } catch (e) {
            // ignore parse
          }
          return reject(new Error(`SBERT matcher exited with code ${code}. Stderr: ${stderr}`));
        }

        try {
          // Parse SBERT output line by line (process may output multiple matches)
          const lines = stdout.trim().split('\n').filter(l => l.trim());
          const matchResults = [];
          
          for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed && parsed.match_percentage !== undefined) {
              matchResults.push(parsed);
            }
          }
          
          // Convert SBERT results to job match format for compatibility
          const jobMatches = matchResults.map((result, idx) => {
            const job = jobs[idx];
            return {
              jobId: job._id,
              title: job.title,
              score: result.match_percentage / 100, // Convert percentage back to 0-1
              matchPercentage: result.match_percentage,
              matches: result.matches || [],
              totalMatches: result.total_matches || 0
            };
          }).filter(m => m.jobId); // Only include results with valid jobs
          
          return resolve(jobMatches);
        } catch (e) {
          return reject(new Error('Failed to parse SBERT matcher output: ' + e.message + ' stdout:' + stdout + ' stderr:' + stderr));
        }
      });

      // Build input: for each job, match resume skills against job requirements
      const matcherInputs = jobs.map(job => ({
        resume_skills: resumeSkills || [],
        job_skills: job.requirements || [],
        threshold: 0.5 // SBERT similarity threshold
      }));

      // Send each match request to SBERT (one per line for streaming processing)
      matcherInputs.forEach(input => {
        py.stdin.write(JSON.stringify(input) + '\n');
      });
      py.stdin.end();
    } catch (err) {
      return reject(err);
    }
  });
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
  // Use a low threshold here so we can send the top-N results returned by the Python matcher
  // (the Python matcher returns scores 0..1 which are converted to 0..100 in findMatchingJobsForUser).
  // By passing 0 we include all ranked matches and then we'll limit to topN for the email.
  const matchingJobs = await findMatchingJobsForUser(user, 0);
    
    // If there are matching jobs, send email
    if (matchingJobs.length > 0) {
      // Limit how many recommendations to include in the email
      const topNVar = process.env.RECOMMENDATIONS_TOP_N || '10';
      // If RECOMMENDATIONS_TOP_N is set to 'all' (case-insensitive) or to a non-positive number,
      // send all matched jobs. Otherwise send the top N.
      let jobs;
      if (String(topNVar).toLowerCase() === 'all' || Number(topNVar) <= 0) {
        jobs = matchingJobs.map(match => match.job);
      } else {
        const topN = Math.max(1, parseInt(topNVar, 10) || 10);
        jobs = matchingJobs.slice(0, topN).map(match => match.job);
      }
      
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
        message: `Sent ${jobs.length} job recommendations to ${user.email}`
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