import express from "express";
import {
  getCollections,
  getCollectionsAdmin,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection,
} from "../controllers/collectionController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getCollections);
router.get("/manage", protect, authorize("admin"), getCollectionsAdmin);
router.post("/", protect, authorize("admin"), createCollection);
router.put("/id/:id", protect, authorize("admin"), updateCollection);
router.delete("/id/:id", protect, authorize("admin"), deleteCollection);
router.get("/:slug", getCollectionBySlug);

export default router;
