import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  createAssignment,
  getAssignments,
  updateAssignment,
  toggleAssignmentCompletion,
  deleteAssignment,
} from "../controllers/assignmentController.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.route("/").post(createAssignment).get(getAssignments);
router.route("/:id/toggle").patch(toggleAssignmentCompletion);
router.route("/:id").put(updateAssignment).delete(deleteAssignment);

export default router;
