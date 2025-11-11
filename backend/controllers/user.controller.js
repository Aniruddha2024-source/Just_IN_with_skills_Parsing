import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { sendJobRecommendationsToUser } from "../services/jobMatchingService.js";
import { writeFile, unlink } from 'fs/promises';
import os from 'os';
import { spawn } from 'child_process';
import path from 'path';


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
    return res.status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,     // 1 day
        httpOnly: true,                 // ✅ fix typo (was httpsOnly)
        sameSite: 'strict',             // ✅ prevents CSRF in dev
        secure: false                   // ❗️set to true in production (HTTPS)
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
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
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

  const py = spawn('python', [scriptPath, tmpPath], { stdio: ['ignore', 'pipe', 'pipe'] });

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

              // Basic skill extraction from a small builtin list
              const knownSkills = [
                'python','java','javascript','react','node','django','flask','sql','mongodb','aws','azure','docker','kubernetes','machine learning','data science','c++','c#','php','html','css','typescript','tensorflow','pytorch','excel','git','rest','graphql'
              ];

              const lowered = parsed.text.toLowerCase();
              const found = new Set();
              for (const s of knownSkills) {
                const key = s.toLowerCase();
                // simple contains check; word boundary for single words
                if (key.includes(' ')) {
                  if (lowered.includes(key)) found.add(s);
                } else {
                  const re = new RegExp('\\b' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
                  if (re.test(parsed.text)) found.add(s);
                }
              }

              if (found.size > 0) {
                const skillList = Array.from(found);
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



