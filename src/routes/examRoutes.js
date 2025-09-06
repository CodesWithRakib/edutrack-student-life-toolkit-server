import express from "express";
import {
  generateExam,
  getExams,
  getExamById,
  deleteExam,
  updateExam,
  submitExam,
} from "../controllers/examController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/generate", verifyFirebaseToken, generateExam);
router.post("/:id/submit", verifyFirebaseToken, submitExam);
router.get("/", verifyFirebaseToken, getExams);
router.get("/:id", verifyFirebaseToken, getExamById);
router.put("/:id", verifyFirebaseToken, updateExam); // 🔹 new update route
router.delete("/:id", verifyFirebaseToken, deleteExam);

export default router;
