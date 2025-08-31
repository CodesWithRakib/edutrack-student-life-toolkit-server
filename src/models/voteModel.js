import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      required: true,
    },
    type: {
      type: String,
      enum: ["up", "down"],
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
voteSchema.index({ user: 1, answer: 1 }, { unique: true }); // Prevent duplicate votes
voteSchema.index({ answer: 1, createdAt: -1 }); // For recent votes

export default mongoose.model("Vote", voteSchema);
