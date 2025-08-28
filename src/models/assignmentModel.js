import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    maxGrade: {
      type: Number,
      default: 100,
    },
    date: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    submitted: {
      type: Boolean,
      default: false,
    },
    graded: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
