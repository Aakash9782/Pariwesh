import express from "express";
import {
  loginUser,
  getUserProfile,
  updateUserProfile,
  getCustomers,
  adminUpdateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/", protect, authorize("admin"), getCustomers);
router.put("/:id", protect, authorize("admin"), adminUpdateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
