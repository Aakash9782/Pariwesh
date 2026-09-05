import express from "express";
import { getSitemap } from "../controllers/seoController.js";

const router = express.Router();

router.route("/sitemap").get(getSitemap);
router.route("/sitemap.xml").get(getSitemap);

export default router;
