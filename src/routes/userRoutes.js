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
} from "../controllers/userController.js";

const router = express.Router();

// Apply Firebase authentication to ALL user routes
// router.use(verifyFirebaseToken);

// User sync route
router.route("/sync").post(createUserIfNotExist);

// Current user routes
router
  .route("/me")
  .get(verifyFirebaseToken, getMyProfile)
  .put(verifyFirebaseToken, updateMyProfile);

// Admin-only routes
router.route("/").get(verifyFirebaseToken, requireAdmin, getAllUsers);

router
  .route("/:id/role")
  .patch(verifyFirebaseToken, requireAdmin, updateUserRole);
router
  .route("/:id/status")
  .patch(verifyFirebaseToken, requireAdmin, updateUserStatus);
export default router;
