import Transaction from "../models/transactionModel.js";
import BudgetCategory from "../models/budgetCategoryModel.js";
import SavingsGoal from "../models/savingsGoalModel.js";

// @desc    Get spending trends over time
// @route   GET /api/analytics/spending-trends
// @access  Private
export const getSpendingTrends = async (req, res) => {
  try {
    const { period = "month", months = 6 } = req.query;
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - parseInt(months));

    const matchStage = {
      user: req.user.uid,
      date: { $gte: startDate },
    };

    // Group by period (month, week, etc.)
    let groupBy;
    if (period === "month") {
      groupBy = {
        year: { $year: "$date" },
        month: { $month: "$date" },
      };
    } else if (period === "week") {
      groupBy = {
        year: { $year: "$date" },
        week: { $week: "$date" },
      };
    } else {
      groupBy = {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" },
      };
    }

    const trends = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            ...groupBy,
            type: "$type",
          },
          amount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
            week: "$_id.week",
            day: "$_id.day",
          },
          income: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "income"] }, "$amount", 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category-wise spending breakdown
// @route   GET /api/analytics/category-breakdown
// @access  Private
export const getCategoryBreakdown = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let startDate;

    if (period === "week") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
      );
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user.uid,
          type: "expense",
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get budget vs actual comparison
// @route   GET /api/analytics/budget-comparison
// @access  Private
export const getBudgetComparison = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let startDate;

    if (period === "week") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
      );
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all budget categories for the user
    const budgetCategories = await BudgetCategory.find({ user: req.user.uid });

    // Calculate spent amount for each category in the period
    const comparison = await Promise.all(
      budgetCategories.map(async (category) => {
        const spent = await Transaction.aggregate([
          {
            $match: {
              user: req.user.uid,
              category: category.category,
              type: "expense",
              date: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]).then((result) => (result[0] ? result[0].total : 0));

        return {
          category: category.category,
          budget: category.budget,
          spent,
          remaining: category.budget - spent,
          percentage: (spent / category.budget) * 100,
        };
      })
    );

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get financial projections
// @route   GET /api/analytics/financial-projections
// @access  Private
export const getFinancialProjections = async (req, res) => {
  try {
    const { months = 3 } = req.query;
    const projectionMonths = parseInt(months);

    // Get current balance
    const currentTransactions = await Transaction.find({ user: req.user.uid });
    const totalIncome = currentTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = currentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = totalIncome - totalExpenses;

    // Calculate average monthly income and expenses
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const recentTransactions = await Transaction.find({
      user: req.user.uid,
      date: { $gte: threeMonthsAgo },
    });

    const monthlyIncome =
      recentTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0) / 3;

    const monthlyExpenses =
      recentTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0) / 3;

    // Generate projections
    const projections = [];
    let projectedBalance = currentBalance;

    for (let i = 1; i <= projectionMonths; i++) {
      const projectionDate = new Date();
      projectionDate.setMonth(now.getMonth() + i);

      projectedBalance += monthlyIncome - monthlyExpenses;

      projections.push({
        month: projectionDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        projectedIncome: monthlyIncome,
        projectedExpenses: monthlyExpenses,
        projectedBalance,
      });
    }

    // Get savings goal if exists
    const savingsGoal = await SavingsGoal.findOne({ user: req.user.uid });

    res.json({
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      projections,
      savingsGoal: savingsGoal
        ? {
            target: savingsGoal.target,
            current: savingsGoal.current,
            projectedAchievement: projectedBalance >= savingsGoal.target,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export transaction data
// @route   GET /api/analytics/export
// @access  Private
export const exportTransactions = async (req, res) => {
  try {
    const { format = "csv", startDate, endDate } = req.query;

    let filter = { user: req.user.uid };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });

    if (format === "csv") {
      // Create CSV content
      const headers = ["Date", "Type", "Category", "Amount", "Description"];
      const csvContent = [
        headers.join(","),
        ...transactions.map((t) =>
          [
            t.date.toISOString().split("T")[0],
            t.type,
            t.category,
            t.amount,
            `"${t.description || ""}"`,
          ].join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=transactions_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      return res.send(csvContent);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=transactions_${
          new Date().toISOString().split("T")[0]
        }.json`
      );
      return res.json(transactions);
    }

    res.status(400).json({ message: "Unsupported export format" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
