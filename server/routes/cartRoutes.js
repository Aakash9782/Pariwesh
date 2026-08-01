import express from "express";
import { getCart, putCart } from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getCart);
router.put("/", protect, putCart);

export default router;
