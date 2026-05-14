import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAdminJobs, getAllJobs, getJobById, postJob, updateJob, saveJob, getSavedJobs, unsaveJob, getJobAnalysis, getJobRecommendations, sendUserRecommendations } from "../controllers/job.controller.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(/*isAuthenticated,*/ getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(isAuthenticated, getJobById);
router.route("/analysis/:jobId").get(isAuthenticated, getJobAnalysis);
router.route("/recommendations").get(isAuthenticated, getJobRecommendations);
router.route("/send-recommendations").post(isAuthenticated, sendUserRecommendations);
router.route("/saved").get(isAuthenticated, getSavedJobs);
router.route("/unsave/:jobId").delete(isAuthenticated, unsaveJob);
export default router;

