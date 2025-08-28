import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createBudgetCategory,
  getBudgetCategories,
  updateBudgetCategory,
  deleteBudgetCategory,
} from "../controllers/budgetCategoryController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/").post(createBudgetCategory).get(getBudgetCategories);
router.route("/:id").put(updateBudgetCategory).delete(deleteBudgetCategory);

export default router;
