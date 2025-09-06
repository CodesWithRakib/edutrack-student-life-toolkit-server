import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: Number, min: 0, max: 100 },
    maxGrade: { type: Number, default: 100 },
    date: { type: Date, required: true },
    dueDate: { type: Date },
    submitted: { type: Boolean, default: false },
    graded: { type: Boolean, default: false },
    feedback: { type: String },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: { type: String },
    completed: { type: Boolean, default: false },
    achieved: { type: Boolean, default: false }, // new: whether grade >= threshold
    durationMinutes: { type: Number, default: 0 }, // optional: time spent
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
