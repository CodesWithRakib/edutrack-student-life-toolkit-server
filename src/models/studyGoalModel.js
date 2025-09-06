import mongoose from "mongoose";

const studyGoalSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    subject: { type: String, required: true },
    targetHours: { type: Number, required: true },
    completedHours: { type: Number, default: 0 },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    achieved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studyGoalSchema.index({ user: 1, subject: 1, period: 1 }); // For uniqueness check

export default mongoose.model("StudyGoal", studyGoalSchema);
