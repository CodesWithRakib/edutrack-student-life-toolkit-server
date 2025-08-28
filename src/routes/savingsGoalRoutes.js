import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  setSavingsGoal,
  getSavingsGoal,
  updateSavingsGoal,
} from "../controllers/savingsGoalController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router
  .route("/")
  .post(setSavingsGoal)
  .get(getSavingsGoal)
  .put(updateSavingsGoal);

export default router;
