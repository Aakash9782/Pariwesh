import express from "express";
import { handleShiprocketWebhook } from "../controllers/shippingController.js";

const router = express.Router();

router.post("/webhook", handleShiprocketWebhook);

export default router;
