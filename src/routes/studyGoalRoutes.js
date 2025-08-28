import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createStudyGoal,
  getStudyGoals,
  updateStudyGoal,
  deleteStudyGoal,
} from "../controllers/studyGoalController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/").post(createStudyGoal).get(getStudyGoals);
router.route("/:id").put(updateStudyGoal).delete(deleteStudyGoal);

export default router;
