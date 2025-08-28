import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createAnswer,
  getAnswersByQuestion,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
  acceptAnswer,
} from "../controllers/answerController.js";

const router = express.Router();

// Public routes
router.route("/question/:questionId").get(getAnswersByQuestion);

// Protected routes
router.use(verifyFirebaseToken);
router.route("/").post(createAnswer);
router.route("/:id").put(updateAnswer).delete(deleteAnswer);
router.route("/:id/vote").post(voteAnswer);
router.route("/:id/accept").post(acceptAnswer);

export default router;
