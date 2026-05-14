import { Job } from "../models/job.model.js";
import { JobAnalysis } from "../models/jobAnalysis.model.js";
import { User } from '../models/user.model.js';
import { notifyUsersAboutNewJob } from '../services/jobMatchingService.js';
import JobRecommendationService from '../services/jobRecommendationService.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Python 3.13 executable path (for Spacy ML integration)
const PYTHON_EXECUTABLE = 'C:\\Users\\aniru\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// admin post krega job


export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      salary,
      company,
      jobType,
      experienceLevel,
      position,
      requirements, // ✅ Already an array from frontend
    } = req.body;

    if (
      !title || !description || !location || !salary ||
      !company || !jobType || !experienceLevel || !position || !requirements
    ) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Unauthorized. Please login again.",
        success: false,
      });
    }

    const job = await Job.create({
      title,
      description,
      location,
      salary: Number(salary),
      company,
      jobType,
      experienceLevel: Number(experienceLevel),
      position: Number(position),
      requirements, // ✅ No .split() needed
      created_by: req.user._id,
    });

    // Extract skills from job description using Spacy NLP asynchronously
    extractJobSkillsAsync(job, title, description, requirements, company)
      .then(analysis => {
        console.log(`Job skills extracted for ${job._id}:`, analysis?.extractedSkills?.length || 0, 'skills found');
        
        // After skills are extracted, send SBERT-based recommendations
        if (analysis?.extractedSkills && analysis.extractedSkills.length > 0) {
          JobRecommendationService.sendRecommendationsForNewJob(job._id)
            .then(result => {
              console.log(`✅ SBERT recommendations sent for job ${job._id}:`, {
                emailsSent: result.sent,
                failed: result.failed
              });
            })
            .catch(err => {
              console.error(`Error sending SBERT recommendations for ${job._id}:`, err.message);
            });
        }
      })
      .catch(err => {
        console.error(`Error extracting job skills for ${job._id}:`, err.message);
      });

    // Trigger job matching and notifications asynchronously
    notifyUsersAboutNewJob(job._id)
      .then(result => {
        console.log(`Notifications sent for new job ${job._id}:`, result);
      })
      .catch(err => {
        console.error(`Error sending notifications for new job ${job._id}:`, err);
      });

    return res.status(201).json({
      message: "Job posted successfully. Notifications will be sent to matching candidates.",
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error posting job:", error);
    return res.status(500).json({
      message: "Something went wrong.",
      success: false,
    });
  }
};

/*export const getAllJobs = async (req, res) => {
  try {
    const keyword = req.query.q?.trim() || "";

    let jobs;

    if (keyword) {
      const regex = new RegExp(keyword, "i"); // i = case-insensitive

      jobs = await Job.find({
        $or: [
          { title: { $regex: regex } },
          { description: { $regex: regex } },
        ],
      })
        .populate("company")
        .sort({ createdAt: -1 });
    } else {
      jobs = await Job.find({})
        .populate("company")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.log("Error fetching jobs:", error.message);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};*/

export const getAllJobs = async (req, res) => {
  try {
    const keyword = req.query.q?.trim().toLowerCase() || "";
    let jobs;

    // Salary range support
    const salaryRegex = /(\d+)[-to]*(\d+)?\s*lpa/;
    const match = keyword.match(salaryRegex);
    const salaryQuery = match ? {
      salary: {
        $gte: parseInt(match[1]) * 100000,
        ...(match[2] ? { $lte: parseInt(match[2]) * 100000 } : {})
      }
    } : {};

    const textRegex = new RegExp(keyword, "i");

    jobs = await Job.find({
      $and: [
        {
          $or: [
            { title: { $regex: textRegex } },
            { description: { $regex: textRegex } },
            { location: { $regex: textRegex } },
            { jobType: { $regex: textRegex } },
          ]
        },
        salaryQuery
      ]
    })
      .populate("company")
      .sort({ createdAt: -1 });

    // Optional: Filter jobs if company.role contains keyword (manual filtering after populate)
    if (keyword) {
      jobs = jobs.filter(job => job.company?.role?.toLowerCase().includes(keyword));
    }

    res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};







// student k liye
/*export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const query = {
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ]
        };
        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({ createdAt: -1 });
        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({
            jobs,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}*/
// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId)
            .populate("company")       // ✅ Add this to include full company details
            .populate("applications");

        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }

        return res.status(200).json({ job, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id || req.user._id; // ✅ fallback for safety

    const jobs = await Job.find({ created_by: adminId })
      .populate("company", "name")  // ✅ Only populate `name` from company
      .sort({ createdAt: -1 });     // ✅ Proper sorting

    if (!jobs || jobs.length === 0) {
      return res.status(404).json({
        message: "Jobs not found.",
        success: false
      });
    }

    return res.status(200).json({
      jobs,
      success: true
    });
  } catch (error) {
    console.error("❌ Error in getAdminJobs:", error);
    return res.status(500).json({
      message: "Server error while fetching jobs.",
      success: false
    });
  }
};


export const updateJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, experienceLevel, location, jobType, position, company } = req.body;

        // Just directly use `requirements` assuming it's already an array
        const adminId = req.id || req.user._id;
        const updatedJob = await Job.findByIdAndUpdate(req.params.jobId, {
            title,
            description,
            requirements, // no need to split here
            salary,
            experienceLevel,
            location,
            jobType,
            position,
            company
        }, { new: true });
        console.log("Params:", req.params);
        res.status(200).json({
            success: true,
            message: "Job updated successfully",
            job: updatedJob
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const saveJob = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const jobId = req.params.jobId;

    // 🔧 Fix: compare properly
    if (!user.savedJobs.some(id => id.toString() === jobId)) {
      user.savedJobs.push(jobId);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Job saved!' });
  } catch (error) {
    console.error("Save Job Error:", error);
    res.status(500).json({ success: false, message: 'Error saving job' });
  }
};


export const getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedJobs');
    res.status(200).json({ success: true, savedJobs: user.savedJobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching saved jobs' });
  }
};

export const unsaveJob = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedJobs = user.savedJobs.filter(
      jobId => jobId.toString() !== req.params.jobId
    );
    await user.save();

    res.status(200).json({ success: true, message: 'Job unsaved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error unsaving job' });
  }
};

/**
 * Extract skills from job description using Spacy NLP
 * Runs asynchronously without blocking the API response
 */
const extractJobSkillsAsync = async (job, jobTitle, jobDescription, requirements, companyId) => {
  try {
    // Prepare combined text for skill extraction
    const combinedText = `
      Job Title: ${jobTitle}
      
      Description: ${jobDescription}
      
      Requirements: ${Array.isArray(requirements) ? requirements.join(', ') : requirements}
    `;

    // Prepare input for Spacy extractor
    const spacyInput = JSON.stringify({
      id: job._id.toString(),
      text: combinedText
    });

    // Path to Spacy skill extractor
    const spacyExtractorPath = path.normalize(path.join(process.cwd(), 'ml', 'spacy_skill_extractor.py'));

    console.log(`Starting skill extraction for job: ${job._id} (${jobTitle})`);

    const spacyPy = spawn(PYTHON_EXECUTABLE, [spacyExtractorPath], { 
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000 
    });

    let spacyOut = '';
    let spacyErr = '';

    spacyPy.stdin.write(spacyInput + '\n');
    spacyPy.stdin.end();

    spacyPy.stdout.on('data', (d) => { spacyOut += d.toString(); });
    spacyPy.stderr.on('data', (d) => { spacyErr += d.toString(); });

    const spacyExitCode = await new Promise((resolve) => spacyPy.on('close', resolve));

    let jobAnalysis = {
      job: job._id,
      company: companyId,
      jobTitle: jobTitle,
      jobDescription: jobDescription,
      requirementsList: Array.isArray(requirements) ? requirements : [requirements],
      extractedSkills: [],
      entities: {},
      confidence: 0.95,
      skillCount: 0,
      extractorUsed: 'spacy-nlp'
    };

    if (spacyExitCode === 0) {
      try {
        const lines = spacyOut.trim().split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const parsed = JSON.parse(line);
            if (parsed.predicted && Array.isArray(parsed.predicted)) {
              jobAnalysis.extractedSkills = parsed.predicted;
              jobAnalysis.skillCount = parsed.predicted.length;
              jobAnalysis.confidence = parsed.confidence || 0.95;

              // Extract entities if available
              if (parsed.entities) {
                jobAnalysis.entities = {
                  TECHNOLOGY: parsed.entities.TECHNOLOGY || [],
                  FRAMEWORK: parsed.entities.FRAMEWORK || [],
                  DATABASE: parsed.entities.DATABASE || [],
                  CLOUD: parsed.entities.CLOUD || [],
                  DEVOPS: parsed.entities.DEVOPS || [],
                  LANGUAGE: parsed.entities.LANGUAGE || [],
                  TOOL: parsed.entities.TOOL || [],
                  METHODOLOGY: parsed.entities.METHODOLOGY || []
                };
              }
            }
          } catch (parseErr) {
            console.error('Error parsing skill extraction output:', parseErr.message);
          }
        }

        console.log(`Extracted ${jobAnalysis.skillCount} skills for job: ${job._id}`);
      } catch (err) {
        console.error('Error processing Spacy output:', err);
        // Fall back to empty skills
        jobAnalysis.extractorUsed = 'rule-based';
        jobAnalysis.extractedSkills = [];
      }
    } else {
      console.error(`Spacy extractor failed with exit code ${spacyExitCode}:`, spacyErr);
      // Fall back to rule-based extraction
      jobAnalysis.extractorUsed = 'rule-based';
      jobAnalysis.extractedSkills = extractSkillsRuleBased(combinedText);
    }

    // Save to MongoDB
    const savedAnalysis = await JobAnalysis.findOneAndUpdate(
      { job: job._id },
      jobAnalysis,
      { upsert: true, new: true }
    );

    console.log(`✓ Job analysis saved for ${job._id} with ${jobAnalysis.skillCount} skills`);
    return savedAnalysis;

  } catch (error) {
    console.error('Error in extractJobSkillsAsync:', error);
    // Continue without throwing - skill extraction failure should not block job posting
    return null;
  }
};

/**
 * Rule-based skill extraction fallback
 * Used when Spacy processing fails
 */
const extractSkillsRuleBased = (text) => {
  const skillKeywords = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'FastAPI', 'Flask',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'Git', 'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Scikit-Learn',
    'REST API', 'GraphQL', 'WebSocket', 'Microservices',
    'Agile', 'Scrum', 'Project Management', 'Team Lead',
    'Communication', 'Problem Solving', 'Critical Thinking'
  ];

  const foundSkills = new Set();
  const lowerText = text.toLowerCase();

  for (const skill of skillKeywords) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
};

export const getJobAnalysis = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const analysis = await JobAnalysis.findOne({ job: jobId });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Job analysis not found'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error fetching job analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job analysis'
    });
  }
};

// Get job recommendations for current user based on SBERT skill matching
export const getJobRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threshold } = req.query;
    const matchThreshold = threshold ? parseInt(threshold) : 50;

    const recommendations = await JobRecommendationService.findMatchingJobsForUser(
      userId,
      matchThreshold
    );

    res.status(200).json({
      success: true,
      count: recommendations.length,
      matchThreshold: matchThreshold,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job recommendations'
    });
  }
};

// Manually send recommendations for a user
export const sendUserRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    const recommendations = await JobRecommendationService.findMatchingJobsForUser(userId, 50);
    
    if (recommendations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No matching jobs found at this time',
        count: 0
      });
    }

    const emailSent = await JobRecommendationService.sendJobRecommendationEmail(userId, recommendations);

    res.status(200).json({
      success: emailSent,
      message: emailSent ? `Recommendation email sent with ${recommendations.length} job(s)` : 'Failed to send email',
      jobsMatched: recommendations.length
    });
  } catch (error) {
    console.error('Error sending recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending recommendations'
    });
  }
};
