import express from "express";
import {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  getUserProfile,
  updateUserProfile,
  getCustomers,
  adminUpdateUser,
  deleteUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendResetOtp,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.post("/resend-reset-otp", resendResetOtp);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/", protect, authorize("admin"), getCustomers);
router.put("/:id", protect, authorize("admin"), adminUpdateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
