import mongoose from "mongoose";

const budgetCategorySchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      default: "bg-gray-500",
    },
  },
  { timestamps: true }
);
budgetCategorySchema.index({ user: 1, category: 1 }, { unique: true });

export default mongoose.model("BudgetCategory", budgetCategorySchema);
