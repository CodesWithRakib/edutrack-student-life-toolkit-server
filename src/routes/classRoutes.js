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
} from "../controllers/classController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/").post(createClass).get(getClasses);
router.route("/upcoming").get(getUpcomingClasses);
router.route("/day/:day").get(getClassesByDay);
router.route("/:id").put(updateClass).delete(deleteClass);
router.route("/weekly").get(getWeeklySchedule);

export default router;
