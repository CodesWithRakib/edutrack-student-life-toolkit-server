import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

//Budget
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetCategoryRoutes from "./routes/budgetCategoryRoutes.js";
import savingsGoalRoutes from "./routes/savingsGoalRoutes.js";
//class
import classRoutes from "./routes/classRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget-categories", budgetCategoryRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
//class
app.use("/api/classes", classRoutes);
// add others: budget, planner, exam, unique

export default app;
