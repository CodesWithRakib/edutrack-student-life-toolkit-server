import express from "express";
import {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  getCategories,
} from "../controllers/resourceController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/categories", getCategories);

// All authenticated users
router
  .route("/")
  .get(verifyFirebaseToken, getResources)
  .post(verifyFirebaseToken, createResource);

router
  .route("/:id")
  .get(verifyFirebaseToken, getResource)
  .put(verifyFirebaseToken, updateResource)
  .delete(verifyFirebaseToken, deleteResource);

router.get("/:id/download", verifyFirebaseToken, downloadResource);

export default router;
