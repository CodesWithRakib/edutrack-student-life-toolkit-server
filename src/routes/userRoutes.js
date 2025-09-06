// src/routes/userRoutes.js
import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/authorize.js";
import {
  createUserIfNotExist,
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  suspendUser,
  activateUser,
} from "../controllers/userController.js";

const router = express.Router();

// ------------------
// User sync route
// ------------------
router.route("/sync").post(createUserIfNotExist);

// ------------------
// Current user routes
// ------------------
router
  .route("/me")
  .get(verifyFirebaseToken, getMyProfile)
  .put(verifyFirebaseToken, updateMyProfile);

// ------------------
// Admin-only routes
// ------------------
router.route("/").get(verifyFirebaseToken, requireAdmin, getAllUsers);

router
  .route("/:id/role")
  .patch(verifyFirebaseToken, requireAdmin, updateUserRole);

router
  .route("/:id/status")
  .patch(verifyFirebaseToken, requireAdmin, updateUserStatus);

// ------------------
// New Admin actions
// ------------------
router
  .route("/:id/delete")
  .delete(verifyFirebaseToken, requireAdmin, deleteUser);

router
  .route("/:id/suspend")
  .patch(verifyFirebaseToken, requireAdmin, suspendUser);

router
  .route("/:id/activate")
  .patch(verifyFirebaseToken, requireAdmin, activateUser);

export default router;
