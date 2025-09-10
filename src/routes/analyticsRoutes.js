import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  getSpendingTrends,
  getCategoryBreakdown,
  getBudgetComparison,
  getFinancialProjections,
  exportTransactions,
} from "../controllers/analyticsController.js";

const router = express.Router();
router.use(verifyFirebaseToken);

// Analytics endpoints
router.get("/spending-trends", getSpendingTrends);
router.get("/category-breakdown", getCategoryBreakdown);
router.get("/budget-comparison", getBudgetComparison);
router.get("/financial-projections", getFinancialProjections);
router.get("/export", exportTransactions);

export default router;
