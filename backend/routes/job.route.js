import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAdminJobs, getAllJobs, getJobById, postJob, updateJob, saveJob, getSavedJobs, unsaveJob } from "../controllers/job.controller.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(/*isAuthenticated,*/ getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(isAuthenticated, getJobById);
router.route("/update/:id").put(isAuthenticated, updateJob);
router.route("/save/:jobId").post(isAuthenticated, saveJob);
router.route("/saved").get(isAuthenticated, getSavedJobs);
router.route("/unsave/:jobId").delete(isAuthenticated, unsaveJob);
export default router;

