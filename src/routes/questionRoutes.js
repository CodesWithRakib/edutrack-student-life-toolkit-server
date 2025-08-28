import express from "express";
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
  getPopularTags,
  getStats,
} from "../controllers/questionController.js";

const router = express.Router();

// Public routes
router.route("/").get(getQuestions);
router.route("/tags").get(getPopularTags);
router.route("/stats").get(getStats);
router.route("/:id").get(getQuestionById);

// Protected routes
router.route("/").post(createQuestion);
router.route("/:id").put(updateQuestion).delete(deleteQuestion);
router.route("/:id/vote").post(voteQuestion);

export default router;
