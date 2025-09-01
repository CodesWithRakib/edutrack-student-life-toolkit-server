import BudgetCategory from "../models/budgetCategoryModel.js";
import Transaction from "../models/transactionModel.js";

// Helper function to calculate spent amount for a category
const calculateSpent = async (userId, category) => {
  return await Transaction.aggregate([
    { $match: { user: userId, category, type: "expense" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).then((result) => (result[0] ? result[0].total : 0));
};

// @desc    Create a budget category
// @route   POST /api/budget-categories
// @access  Private
export const createBudgetCategory = async (req, res) => {
  try {
    const { category, budget, color } = req.body;

    // Check if category already exists for this user
    const existingCategory = await BudgetCategory.findOne({
      user: req.user.uid,
      category,
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const budgetCategory = await BudgetCategory.create({
      user: req.user.uid,
      category,
      budget,
      color,
    });

    res.status(201).json(budgetCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all budget categories for the logged-in user
// @route   GET /api/budget-categories
// @access  Private
export const getBudgetCategories = async (req, res) => {
  try {
    const budgetCategories = await BudgetCategory.find({ user: req.user.uid });

    // Calculate spent amount for each category
    const categoriesWithSpent = await Promise.all(
      budgetCategories.map(async (category) => {
        const spent = await calculateSpent(req.user.uid, category.category);
        return { ...category.toObject(), spent };
      })
    );

    res.json(categoriesWithSpent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a budget category
// @route   PUT /api/budget-categories/:id
// @access  Private
export const updateBudgetCategory = async (req, res) => {
  try {
    const budgetCategory = await BudgetCategory.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      req.body,
      { new: true }
    );

    if (!budgetCategory) {
      return res.status(404).json({ message: "Budget category not found" });
    }

    // Calculate spent amount
    const spent = await calculateSpent(req.user.uid, budgetCategory.category);

    res.json({ ...budgetCategory.toObject(), spent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a budget category
// @route   DELETE /api/budget-categories/:id
// @access  Private
export const deleteBudgetCategory = async (req, res) => {
  try {
    const budgetCategory = await BudgetCategory.findOneAndDelete({
      _id: req.params.id,
      user: req.user.uid,
    });

    if (!budgetCategory) {
      return res.status(404).json({ message: "Budget category not found" });
    }

    res.json({ message: "Budget category removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
