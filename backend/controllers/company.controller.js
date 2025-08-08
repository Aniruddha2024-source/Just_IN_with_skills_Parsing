import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";




// export const registerCompany = async (req, res) => {
//   try {
//     const { companyName } = req.body;

//     if (!companyName) {
//       return res.status(400).json({
//         message: "Company name is required.",
//         success: false,
//       });
//     }

//     const existing = await Company.findOne({ name: companyName });
//     if (existing) {
//       return res.status(400).json({
//         message: "You can't register same company.",
//         success: false,
//       });
//     }

//     const company = await Company.create({
//       name: companyName,
//       userId: req.user._id // ✅ uses authenticated user
//     });

//     return res.status(201).json({
//       message: "Company registered successfully.",
//       company,
//       success: true,
//     });
//   } catch (error) {
//     console.log("Register company error:", error);
//     return res.status(500).json({
//       message: "Something went wrong while registering company.",
//       success: false,
//     });
//   }
// };



export const registerCompany = async (req, res) => {
  try {
    const { companyName } = req.body;

    if (!companyName || companyName.trim() === "") {
      return res.status(400).json({
        message: "Company name is required.",
        success: false,
      });
    }
    
    const existing = await Company.findOne({ name: companyName });
    if (existing) {
      return res.status(400).json({
        message: "You can't register same company.",
        success: false,
      });
    }

    // ✅ Make sure `req.user._id` exists (set by isAuthenticated middleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Unauthorized. User not found.",
        success: false,
      });
    }

    const company = await Company.create({
      name: companyName.trim(),
      userId: req.user._id
      
    });
    console.log("Current logged-in user in company register:", req.user._id);
    return res.status(201).json({
      message: "Company registered successfully.",
      company,
      success: true,
    });
  } catch (error) {
    console.error("Register company error:", error);
    return res.status(500).json({
      message: "Something went wrong while registering company.",
      success: false,
    });
  }
};




export const getCompany = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Correct way to access current user's ID
    console.log("Fetching companies for user:", userId);

    const companies = await Company.find({ userId });

    return res.status(200).json({
      companies,
      success: true,
    });
  } catch (error) {
    console.error("Get company error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching companies",
      success: false,
    });
  }
};

// get company by id
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }
    res.status(200).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updateCompany = async (req, res) => {
  try {
    const { name, description, website, location } = req.body;
    const file = req.file;

    // ✅ Step 1: Check if another company already has this name
    const existingCompany = await Company.findOne({ name });

    // 🛑 If found and not the same as the current company
    if (existingCompany && existingCompany._id.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Company name already exists. Please use a different name."
      });
    }

    let logo;

    if (file) {
      const fileUri = getDataUri(file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      logo = cloudResponse.secure_url;
    }

    const updateData = {
      name,
      description,
      website,
      location,
    };
    if (logo) updateData.logo = logo;

    const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!company) {
      return res.status(404).json({
        message: "Company not found.",
        success: false
      });
    }

    return res.status(200).json({
      message: "Company information updated.",
      success: true
    });

  } catch (error) {
    console.error("updateCompany error:", error);
    res.status(500).json({
      message: "Server error",
      success: false
    });
  }
};

