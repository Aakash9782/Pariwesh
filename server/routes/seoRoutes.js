import express from "express";
import { getSitemap, getGoogleMerchantFeed } from "../controllers/seoController.js";

const router = express.Router();

router.route("/sitemap").get(getSitemap);
router.route("/sitemap.xml").get(getSitemap);
router.route("/google-merchant-feed.xml").get(getGoogleMerchantFeed);
router.route("/google-merchant-feed").get(getGoogleMerchantFeed);
router.route("/google-merchant").get(getGoogleMerchantFeed);

export default router;

