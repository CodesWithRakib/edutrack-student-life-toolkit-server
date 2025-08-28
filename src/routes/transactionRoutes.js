import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createTransaction,
  getTransactions,
  getTransactionSummary,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/").post(createTransaction).get(getTransactions);
router.route("/summary").get(getTransactionSummary);
router.route("/:id").put(updateTransaction).delete(deleteTransaction);

export default router;
