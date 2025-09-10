import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createClass,
  getClasses,
  getClassesByDay,
  getUpcomingClasses,
  updateClass,
  deleteClass,
  getWeeklySchedule,
  getClassById,
  getClassStats,
  bulkCreateClasses,
  updateClassColor,
} from "../controllers/classController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/").post(createClass).get(getClasses);
router.route("/weekly").get(getWeeklySchedule);
router.route("/upcoming").get(getUpcomingClasses);
router.route("/day/:day").get(getClassesByDay);
router.route("/stats").get(getClassStats);
router.route("/bulk").post(bulkCreateClasses);
router.route("/:id/color").patch(updateClassColor);
router.route("/:id").get(getClassById).put(updateClass).delete(deleteClass);

export default router;
