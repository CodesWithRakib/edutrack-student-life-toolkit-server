import mongoose from "mongoose";

const budgetCategorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

export default mongoose.model("BudgetCategory", budgetCategorySchema);
