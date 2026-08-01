import express from "express";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getBrands);
router.post("/", protect, authorize("admin"), createBrand);
router.put("/:id", protect, authorize("admin"), updateBrand);
router.delete("/:id", protect, authorize("admin"), deleteBrand);

export default router;
