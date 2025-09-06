import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

studySessionSchema.index({ user: 1, subject: 1, date: 1 }); // For faster filtering

export default mongoose.model("StudySession", studySessionSchema);
