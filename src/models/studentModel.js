import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Teacher who manages this student
    name: { type: String, required: true },
    email: { type: String, required: true },
    grade: { type: String, required: true },
    enrolled: { type: Date, required: true },
    attendance: { type: Number, default: 0 }, // %
    performance: { type: String, default: "Average" },
    subjects: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
