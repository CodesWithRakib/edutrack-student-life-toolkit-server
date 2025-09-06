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
//study
import studySessionRoutes from "./routes/studySessionRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import studyGoalRoutes from "./routes/studyGoalRoutes.js";
//question
import questionRoutes from "./routes/questionRoutes.js";
import answerRoutes from "./routes/answerRoutes.js";
// performance
import performanceRoutes from "./routes/performanceRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import examRoutes from "./routes/examRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Health check route (add this first)
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!", timestamp: new Date() });
});

// Routes - ORDER MATTERS!
app.use("/api/users", userRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget-categories", budgetCategoryRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/study-sessions", studySessionRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/study-goals", studyGoalRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/exams", examRoutes);

export default app;
