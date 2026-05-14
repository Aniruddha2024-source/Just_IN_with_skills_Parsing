import { User } from "../models/user.model.js";
import { ResumeAnalysis } from "../models/resumeAnalysis.model.js";
import { computeSkillMetrics } from "../services/skillEvaluationService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { sendJobRecommendationsToUser } from "../services/jobMatchingService.js";
import { writeFile, unlink } from 'fs/promises';
import os from 'os';
import { spawn } from 'child_process';
import path from 'path';

// Python 3.13 executable path (for Spacy ML integration)
const PYTHON_EXECUTABLE = 'C:\\Users\\aniru\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';


/*export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
         
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        const file = req.file;
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile:{
                profilePhoto:cloudResponse.secure_url,
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}*/

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
        
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Profile photo is required",
                success: false
            });
        }

        const fileUri = getDataUri(req.file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                message: 'User already exists with this email.',
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto: cloudResponse.secure_url,
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};










// export const login = async (req, res) => {
//     try {

//         console.log("Login request body:", req.body);
//         const { email, password, role } = req.body;
        
//         if (!email || !password || !role) {
//             return res.status(400).json({
//                 message: "Something is missing",
//                 success: false
//             });
//         };
//         let user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({
//                 message: "Incorrect email or password.",
//                 success: false,
//             })
//         }
//         const isPasswordMatch = await bcrypt.compare(password, user.password);
//         if (!isPasswordMatch) {
//             return res.status(400).json({
//                 message: "Incorrect email or password.",
//                 success: false,
//             })
//         };
//         // check role is correct or not
//         if (role !== user.role) {
//             return res.status(400).json({
//                 message: "Account doesn't exist with current role.",
//                 success: false
//             })
//         };

//         const tokenData = {
//             userId: user._id
//         }
//         //console.log("JWT_SECRET:", process.env.JWT_SECRET);
//         const token = await jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '1d' });

//         user = {
//             _id: user._id,
//             fullname: user.fullname,
//             email: user.email,
//             phoneNumber: user.phoneNumber,
//             role: user.role,
//             profile: user.profile
//         }

//         return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
//             message: `Welcome back ${user.fullname}`,
//             user,
//             success: true
//         })
//     } catch (error) {
//         console.log(error);
//     }
// }



export const login = async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password, role } = req.body;

    // Step 1: Check if all fields are provided
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false
      });
    }

    // Step 2: Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    // Step 3: Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    // Step 4: Check role
    if (role !== user.role) {
      return res.status(400).json({
        message: "Account doesn't exist with current role.",
        success: false
      });
    }

    // Step 5: Generate JWT token
    const tokenData = {
      _id: user._id // ✅ Important: use `_id` here as used elsewhere
      
    };
    console.log("Logging in user with ID:", user._id);
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Step 6: Prepare user data to send back (no password)
    const userData = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile
    };

    // Step 7: Set cookie and return response
    // For cross-origin requests (Vercel frontend with Railway backend), use SameSite=None with Secure
    const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_URL?.includes('vercel.app');
    
    console.log("=== LOGIN COOKIE DEBUG ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("isProduction:", isProduction);
    console.log("Cookie settings:", {
      path: '/',
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction ? true : false,
      httpOnly: true
    });
    
    return res.status(200)
      .cookie("token", token, {
        path: '/',                                // CRITICAL: Set path to / so cookie is sent to all routes
        maxAge: 1 * 24 * 60 * 60 * 1000,         // 1 day
        httpOnly: true,                           // Prevents JavaScript access
        sameSite: isProduction ? 'none' : 'lax',  // 'none' for cross-origin, 'lax' for local dev
        secure: isProduction ? true : false       // 'true' for production (HTTPS), 'false' for local dev
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user: userData,
        success: true
      });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
  
};


export const logout = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_URL?.includes('vercel.app');
        
        return res.status(200).cookie("token", "", {
            path: '/',                                      // Clear at root path
            maxAge: 0,
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax',
            secure: isProduction ? true : false
        }).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}


export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const file = req.file;

    // Track if skills were updated
    let skillsUpdated = false;
    let skillsArray;
    
    if (skills) {
      skillsArray = skills.split(',').map(skill => skill.trim());
      skillsUpdated = true;
    }

    const userId = req.user._id; // ✅ use req.user._id instead of req.id
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "User not found.",
        success: false
      });
    }

    // Update fields if provided
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skillsArray;

    // Upload resume if provided
    if (file) {
      // Convert file to Data URI and upload to Cloudinary
      const fileUri = getDataUri(file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: "raw", // Force treat it as file (PDF, DOCX, etc.)
        folder: "resume", // optional: organize your uploads
        use_filename: true,
        unique_filename: false
      });
      
      // Save resume to cloud
      if (cloudResponse) {
        user.profile.resume = cloudResponse.secure_url;
        user.profile.resumeOriginalName = file.originalname;
      }
      console.log("Cloudinary Upload Response:", cloudResponse);
      
      // Try to extract resume text using Python extractor
      try {
        // write buffer to a temp file with original extension
        const tmpDir = os.tmpdir();
        const ext = path.extname(file.originalname) || '.pdf';
        const tmpPath = path.join(tmpDir, `resume-${Date.now()}${ext}`);
        await writeFile(tmpPath, file.buffer);

  // call python extractor script (resolve from process.cwd()). If server is started from backend/ folder,
  // process.cwd() already points to backend, so do NOT prepend another 'backend' segment.
  const scriptPath = path.normalize(path.join(process.cwd(), 'ml', 'extract_resume.py'));
  console.log('Calling resume extractor at', scriptPath);

  const py = spawn(PYTHON_EXECUTABLE, [scriptPath, tmpPath], { stdio: ['ignore', 'pipe', 'pipe'] });

        let out = '';
        let err = '';
        py.stdout.on('data', (d) => { out += d.toString(); });
        py.stderr.on('data', (d) => { err += d.toString(); });

        const exitCode = await new Promise((resolve) => py.on('close', resolve));
        if (exitCode === 0) {
          try {
            const parsed = JSON.parse(out || '{}');
            if (parsed.text) {
              // Save extracted text to profile
              user.profile.resumeText = parsed.text;

              // Use Spacy-based skill extraction for production-grade NLP
              console.log('Calling Spacy skill extractor for advanced skill detection...');
              const spacyExtractorPath = path.normalize(path.join(process.cwd(), 'ml', 'spacy_skill_extractor.py'));
              
              // Prepare input for Spacy extractor
              const spacyInput = JSON.stringify({
                id: user._id.toString(),
                text: parsed.text
              });

              const spacyPy = spawn(PYTHON_EXECUTABLE, [spacyExtractorPath], { stdio: ['pipe', 'pipe', 'pipe'] });
              let spacyOut = '';
              let spacyErr = '';
              
              spacyPy.stdin.write(spacyInput + '\n');
              spacyPy.stdin.end();
              
              spacyPy.stdout.on('data', (d) => { spacyOut += d.toString(); });
              spacyPy.stderr.on('data', (d) => { spacyErr += d.toString(); });

              const spacyExitCode = await new Promise((resolve) => spacyPy.on('close', resolve));

              let skillList = [];
              let extractorUsed = 'rule-v1'; // fallback
              
              if (spacyExitCode === 0) {
                try {
                  const spacyResult = JSON.parse(spacyOut.trim());
                  skillList = spacyResult.predicted || [];
                  extractorUsed = 'spacy-v1';
                  console.log(`✓ Spacy extracted ${skillList.length} skills using NLP analysis`);
                } catch (e) {
                  console.warn('Spacy result parsing failed, falling back to rule-based extractor:', e.message);
                  // Fallback to simple rule-based extraction
                  const knownSkills = [
                    'python','java','javascript','react','node','django','flask','sql','mongodb','aws','azure','docker','kubernetes','machine learning','data science','c++','c#','php','html','css','typescript','tensorflow','pytorch','excel','git','rest','graphql'
                  ];
                  const lowered = parsed.text.toLowerCase();
                  const found = new Set();
                  for (const s of knownSkills) {
                    const key = s.toLowerCase();
                    if (key.includes(' ')) {
                      if (lowered.includes(key)) found.add(s);
                    } else {
                      const re = new RegExp('\\b' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
                      if (re.test(parsed.text)) found.add(s);
                    }
                  }
                  skillList = Array.from(found);
                }
              } else {
                console.warn('Spacy extractor failed:', spacyErr);
                // Fallback to rule-based extraction
                const knownSkills = [
                  'python','java','javascript','react','node','django','flask','sql','mongodb','aws','azure','docker','kubernetes','machine learning','data science','c++','c#','php','html','css','typescript','tensorflow','pytorch','excel','git','rest','graphql'
                ];
                const lowered = parsed.text.toLowerCase();
                const found = new Set();
                for (const s of knownSkills) {
                  const key = s.toLowerCase();
                  if (key.includes(' ')) {
                    if (lowered.includes(key)) found.add(s);
                  } else {
                    const re = new RegExp('\\b' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
                    if (re.test(parsed.text)) found.add(s);
                  }
                }
                skillList = Array.from(found);
              }

              if (skillList.length > 0) {
                // Create a ResumeAnalysis record to store predicted skills and text
                try {
                  // compute metrics against any existing profile.skills (if present) so we can log immediate accuracy
                  const existingSkills = Array.isArray(user.profile?.skills) ? user.profile.skills : [];
                  const metrics = computeSkillMetrics(existingSkills, skillList);

                  const analysis = await ResumeAnalysis.create({
                    user: user._id,
                    resumeUrl: cloudResponse?.secure_url,
                    resumeOriginalName: file.originalname,
                    extractor: extractorUsed,
                    predicted: skillList,
                    resumeText: parsed.text,
                    metrics
                  });
                  // attach latest analysis id for client to reference
                  user.profile.lastResumeAnalysis = analysis._id;

                  // Log metrics to server terminal for immediate visibility
                  console.log(`✓ ResumeAnalysis for user=${user._id} analysis=${analysis._id} extractor=${extractorUsed} — TP=${metrics.TP} FP=${metrics.FP} FN=${metrics.FN} precision=${(metrics.precision*100).toFixed(1)}% recall=${(metrics.recall*100).toFixed(1)}% f1=${(metrics.f1*100).toFixed(1)}% jaccard=${(metrics.jaccard*100).toFixed(1)}%`);
                } catch (e) {
                  console.warn('Failed to create ResumeAnalysis record:', e.message || e);
                }
                // merge with any existing skills provided in request
                const existing = Array.isArray(user.profile?.skills) ? user.profile.skills : [];
                const merged = Array.from(new Set([...existing, ...skillList]));
                user.profile.skills = merged;
                skillsUpdated = true;
              }
            }
          } catch (e) {
            console.warn('Failed parsing extractor output:', e.message);
          }
        } else {
          console.warn('Resume extractor returned non-zero code', exitCode, err);
        }

        // cleanup temp file
        try { await unlink(tmpPath); } catch (e) { /* ignore */ }
      } catch (e) {
        console.warn('Resume extraction failed:', e.message || e);
      }
    }
    await user.save();

    // If skills were updated, trigger job matching
    if (skillsUpdated && user.role === 'student') {
      // Process job matching asynchronously
      sendJobRecommendationsToUser(user._id)
        .then(result => {
          console.log(`Job recommendations sent to user ${user._id}:`, result);
        })
        .catch(err => {
          console.error(`Error sending job recommendations to user ${user._id}:`, err);
        });
    }

    // Format user object for response
    const userResponse = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile
    };

    return res.status(200).json({
      message: skillsUpdated 
        ? "Profile updated successfully. You will receive job recommendations based on your updated skills."
        : "Profile updated successfully.",
      user: userResponse,
      success: true
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Something went wrong",
      success: false
    });
  }
};

export const confirmSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    const { analysisId, confirmed } = req.body;

    if (!Array.isArray(confirmed)) {
      return res.status(400).json({ message: 'confirmed must be an array of skills', success: false });
    }

    let analysis = null;
    if (analysisId) {
      analysis = await ResumeAnalysis.findById(analysisId);
    } else {
      // fallback: get latest analysis for this user
      analysis = await ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 });
    }

    if (!analysis) {
      return res.status(404).json({ message: 'No resume analysis found', success: false });
    }

    analysis.confirmed = confirmed;
    const metrics = computeSkillMetrics(confirmed, analysis.predicted || []);
    analysis.metrics = metrics;
    await analysis.save();

    // Log metrics to server terminal so admins/developers see accuracy on confirmation
    console.log(`ResumeAnalysis confirmed for user=${analysis.user} analysis=${analysis._id} — TP=${metrics.TP} FP=${metrics.FP} FN=${metrics.FN} precision=${(metrics.precision*100).toFixed(1)}% recall=${(metrics.recall*100).toFixed(1)}% f1=${(metrics.f1*100).toFixed(1)}% jaccard=${(metrics.jaccard*100).toFixed(1)}%`);

    return res.status(200).json({ message: 'Skills confirmed and evaluated', success: true, metrics, analysisId: analysis._id });
  } catch (error) {
    console.error('confirmSkills error:', error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const getResumeAnalysis = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'analysis id required', success: false });
    const analysis = await ResumeAnalysis.findById(id);
    if (!analysis) return res.status(404).json({ message: 'analysis not found', success: false });
    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    console.error('getResumeAnalysis error:', error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};

/*export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const file = req.file;

    const userId = req.user._id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found.", success: false });
    }

    // Update basic fields
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;

    let finalSkills = [];

    // 1. Handle resume upload to Cloudinary
    if (file) {
      const fileUri = getDataUri(file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: "raw",
        folder: "resume",
        use_filename: true,
        unique_filename: false
      });

      user.profile.resume = cloudResponse.secure_url;
      user.profile.resumeOriginalName = file.originalname;

      // 2. Extract skills from resume PDF
      finalSkills = await extractSkills(file.path);
      fs.unlinkSync(file.path); // clean up local file
    }

    // 3. Fallback to manual skills input if no file
    if (skills && finalSkills.length === 0) {
      finalSkills = skills.split(",").map(s => s.trim().toLowerCase());
    }

    // 4. Save extracted/manual skills to user profile
    if (finalSkills.length > 0) {
      user.profile.skills = finalSkills;
    }

    await user.save();

    // 5. Check for job matches
    const jobs = await Job.find();
    const matchingJobs = jobs.filter(job =>
      job.requirements.some(reqSkill =>
        user.profile.skills.includes(reqSkill.toLowerCase())
      )
    );

    if (matchingJobs.length > 0) {
      await sendMatchEmail(user.email, matchingJobs);
    }

    // 6. Return updated user
    const sanitizedUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile
    };

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: sanitizedUser,
      success: true
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Something went wrong",
      success: false
    });
  }
};*/


/**
 * Extract skills from resume text using Spacy NLP
 * Called when user wants to re-extract skills or use advanced NLP
 */
export const extractResumeSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    const { resumeText } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
      return res.status(400).json({
        message: 'Resume text is required',
        success: false
      });
    }

    // Get user to verify ownership
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false
      });
    }

    console.log(`Extracting skills for user ${userId} using Spacy NLP...`);

    // Call Spacy skill extractor
    const spacyExtractorPath = path.normalize(path.join(process.cwd(), 'ml', 'spacy_skill_extractor.py'));
    
    const spacyInput = JSON.stringify({
      id: userId.toString(),
      text: resumeText
    });

    const spacyPy = spawn('python', [spacyExtractorPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let spacyOut = '';
    let spacyErr = '';
    
    spacyPy.stdin.write(spacyInput + '\n');
    spacyPy.stdin.end();
    
    spacyPy.stdout.on('data', (d) => { spacyOut += d.toString(); });
    spacyPy.stderr.on('data', (d) => { spacyErr += d.toString(); });

    const spacyExitCode = await new Promise((resolve) => spacyPy.on('close', resolve));

    if (spacyExitCode !== 0) {
      console.error('Spacy extraction failed:', spacyErr);
      return res.status(500).json({
        message: 'Failed to extract skills using NLP',
        success: false,
        error: spacyErr
      });
    }

    try {
      const spacyResult = JSON.parse(spacyOut.trim());
      const skillList = spacyResult.predicted || [];
      const entities = spacyResult.entities || {};
      const confidence = spacyResult.confidence || 0;

      // Create ResumeAnalysis record
      const existingSkills = Array.isArray(user.profile?.skills) ? user.profile.skills : [];
      const metrics = computeSkillMetrics(existingSkills, skillList);

      const analysis = await ResumeAnalysis.create({
        user: userId,
        resumeText: resumeText,
        resumeOriginalName: 'manual-extraction',
        extractor: 'spacy-v1',
        predicted: skillList,
        metrics
      });

      console.log(`✓ Spacy skill extraction: ${skillList.length} skills detected (confidence: ${confidence.toFixed(2)})`);

      return res.status(200).json({
        message: 'Skills extracted successfully using Spacy NLP',
        success: true,
        data: {
          analysisId: analysis._id,
          skills: skillList,
          entities: entities,
          confidence: confidence,
          metrics: {
            precision: (metrics.precision * 100).toFixed(1),
            recall: (metrics.recall * 100).toFixed(1),
            f1: (metrics.f1 * 100).toFixed(1),
            jaccard: (metrics.jaccard * 100).toFixed(1)
          }
        }
      });
    } catch (e) {
      console.error('Failed to parse Spacy output:', e.message);
      return res.status(500).json({
        message: 'Failed to parse skill extraction result',
        success: false,
        error: e.message
      });
    }

  } catch (error) {
    console.error('extractResumeSkills error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false,
      error: error.message
    });
  }
};
