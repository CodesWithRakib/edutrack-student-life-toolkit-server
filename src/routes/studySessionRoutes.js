import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createStudySession,
  getStudySessions,
  updateStudySession,
  toggleStudySessionCompletion,
  deleteStudySession,
} from "../controllers/studySessionController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/").post(createStudySession).get(getStudySessions);
router.route("/:id/toggle").patch(toggleStudySessionCompletion);
router.route("/:id").put(updateStudySession).delete(deleteStudySession);

export default router;
