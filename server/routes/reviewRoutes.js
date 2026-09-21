import express from "express";
import {
  getProductReviews,
  createReview,
  markHelpful,
  adminGetReviews,
  adminUpdateReviewStatus,
  adminDeleteReview,
  adminCreateManualReview,
} from "../controllers/reviewController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", createReview);
router.post("/:id/helpful", markHelpful);

// Admin moderation routes
router.use("/admin", protect, authorize("admin"));
router.get("/admin", adminGetReviews);
router.post("/admin/manual", adminCreateManualReview);
router.patch("/admin/:id/status", adminUpdateReviewStatus);
router.delete("/admin/:id", adminDeleteReview);

export default router;
