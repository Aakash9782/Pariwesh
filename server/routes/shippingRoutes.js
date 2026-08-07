import express from "express";
import { handleShiprocketWebhook } from "../controllers/shippingController.js";

const router = express.Router();

router.post("/webhook", handleShiprocketWebhook);
router.post("/events", handleShiprocketWebhook);

export default router;
