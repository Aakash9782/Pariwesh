import express from "express";
import {
  createReturnRequest,
  getReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
} from "../controllers/returnController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All routes require authentication

router.route("/").post(createReturnRequest).get(getReturnRequests);

router
  .route("/:id")
  .get(getReturnRequestById)
  .put(authorize("admin"), updateReturnStatus);

export default router;
