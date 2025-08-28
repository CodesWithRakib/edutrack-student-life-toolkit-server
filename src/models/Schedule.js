import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "Math Class"
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // "10:00 AM - 11:30 AM"
    teacher: { type: String }, // firebase uid of teacher
    students: [{ type: String }], // firebase uid of students
    createdBy: { type: String, required: true }, // who created (uid)
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
