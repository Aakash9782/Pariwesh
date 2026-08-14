import express from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductsByColorGroup,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.route("/color-group/:groupId").get(getProductsByColorGroup);

router
  .route("/")
  .get(getProducts)
  .post(protect, authorize("admin"), createProduct);

router.route("/:slug").get(getProductBySlug);

router
  .route("/id/:id")
  .delete(protect, authorize("admin"), deleteProduct)
  .put(protect, authorize("admin"), updateProduct);

export default router;
