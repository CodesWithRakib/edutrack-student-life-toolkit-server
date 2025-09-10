import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // Firebase UID
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    answer: { type: mongoose.Schema.Types.ObjectId, ref: "Answer" },
    type: { type: String, enum: ["up", "down"], required: true },
  },
  { timestamps: true }
);

// Ensure a user can only vote once per question/answer
voteSchema.index({ user: 1, question: 1 }, { unique: true, sparse: true });
voteSchema.index({ user: 1, answer: 1 }, { unique: true, sparse: true });

const voteModel = mongoose.model("Vote", voteSchema);

export default voteModel;
