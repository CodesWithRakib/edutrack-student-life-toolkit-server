import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: Number, required: true, min: 0, max: 100 },
    maxGrade: { type: Number, default: 100 },
    trend: { type: String, enum: ["up", "down", "stable"], default: "stable" },
    date: { type: Date, default: Date.now },
    term: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Grade", gradeSchema);
