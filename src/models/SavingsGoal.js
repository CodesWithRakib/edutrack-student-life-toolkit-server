import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    current: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

// Ensure only one savings goal per user
savingsGoalSchema.index({ user: 1 }, { unique: true });

export default mongoose.model("SavingsGoal", savingsGoalSchema);
