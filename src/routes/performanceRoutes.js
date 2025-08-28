import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  getPerformanceOverview,
  getGradesData,
  getStudyAnalytics,
  getStudyRecommendations,
} from "../controllers/performanceController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/overview").get(getPerformanceOverview);
router.route("/grades").get(getGradesData);
router.route("/analytics").get(getStudyAnalytics);
router.route("/recommendations").get(getStudyRecommendations);

export default router;
