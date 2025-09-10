// routes/statsRoutes.js
import express from "express";
import {
  getGlobalStats,
  getWeeklyStats,
} from "../controllers/statsController.js";

const router = express.Router();

router.get("/global", getGlobalStats);
router.get("/weekly", getWeeklyStats);

export default router;
