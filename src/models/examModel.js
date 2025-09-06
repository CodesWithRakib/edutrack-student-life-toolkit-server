import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "multiple-choice" | "true-false" | "short-answer" | "essay"
  questionText: { type: String, required: true },
  options: [String], // only for MCQ
  correctAnswer: mongoose.Schema.Types.Mixed,
  aiGenerated: { type: Boolean, default: true },
});

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  difficulty: {
    type: String,
    required: true,
    enum: ["easy", "medium", "hard"],
  }, // ✅ added difficulty
  questions: [QuestionSchema],
  createdBy: { type: String, required: true }, // Firebase UID
  createdAt: { type: Date, default: Date.now },
});

const Exam = mongoose.model("Exam", ExamSchema);

export default Exam;
