import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createUserIfNotExist,
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  updateUserRole,
} from "../controllers/userController.js";

const router = express.Router();

// Sync user (on login/signup)
router.post("/sync", verifyFirebaseToken, createUserIfNotExist);

// Get logged-in user profile
router.get("/me", verifyFirebaseToken, getMyProfile);

// Update own profile
router.put("/me", verifyFirebaseToken, updateMyProfile);

// Admin-only: Get all users
router.get("/", verifyFirebaseToken, getAllUsers);

// Admin-only: Update role (student/teacher/admin)
router.patch("/:id/role", verifyFirebaseToken, updateUserRole);

export default router;
