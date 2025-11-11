import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";



export const applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required."
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found."
      });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job."
      });
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id
    });

    // Push this application to Job
    job.applications.push(application._id);
    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job applied successfully.",
      application
    });
  } catch (error) {
    console.log("Apply job error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
};



// export const getAppliedJobs = async (req,res) => {
//     try {
//         const userId = req.id;
//         const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
//             path:'job',
//             options:{sort:{createdAt:-1}},
//             populate:{
//                 path:'company',
//                 options:{sort:{createdAt:-1}},
//             }
//         });
//         if(!application){
//             return res.status(404).json({
//                 message:"No Applications",
//                 success:false
//             })
//         };
//         return res.status(200).json({
//             application,
//             success:true
//         })
//     } catch (error) {
//         console.log(error);
//     }
// }
// admin dekhega kitna user ne apply kiya hai

export const getAppliedJobs = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await Application.find({ applicant: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'job',
        populate: {
          path: 'company',
        },
      });

    if (application.length === 0) {
      return res.status(200).json({
        application: [],
        success: true,
        message: "No job applications found"
      });
    }

    return res.status(200).json({
      application,
      success: true
    });

  } catch (error) {
    console.error("getAppliedJobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};





















export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            succees:true
        });
    } catch (error) {
        console.log(error);
    }
}
export const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId});
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

    // normalize & validate status (schema expects lowercase values)
    const allowedStatuses = ["pending", "accepted", "rejected"];
    const normalized = String(status).trim().toLowerCase();
    if (!allowedStatuses.includes(normalized)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
        success: false
      });
    }

    application.status = normalized;
    await application.save();

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
    }
}