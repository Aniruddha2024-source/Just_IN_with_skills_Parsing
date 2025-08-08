import { Job } from "../models/job.model.js";
import { User } from '../models/user.model.js';
import { notifyUsersAboutNewJob } from '../services/jobMatchingService.js';


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

