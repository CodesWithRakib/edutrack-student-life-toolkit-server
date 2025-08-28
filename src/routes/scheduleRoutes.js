import express from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";

const router = express.Router();

// ✅ /api/schedules
router.post("/", createSchedule); // Create schedule
router.get("/", getSchedules); // Get all schedules
router.get("/:id", getScheduleById); // Get single schedule
router.put("/:id", updateSchedule); // Update schedule
router.delete("/:id", deleteSchedule); // Delete schedule

export default router;
