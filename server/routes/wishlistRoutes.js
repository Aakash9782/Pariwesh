import express from "express";
import { getWishlist, putWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.put("/", protect, putWishlist);

export default router;
