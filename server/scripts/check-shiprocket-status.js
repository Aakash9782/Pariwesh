import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

// Disable Mongoose buffering globally so queries fail immediately if not connected
mongoose.set("bufferCommands", false);

const checkStatus = async () => {
  console.log("Connecting database...");

  // Set connection timeout structure
  const connPromise = connectDB();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Mongoose connection timeout (5s)")),
      5000,
    ),
  );

  await Promise.race([connPromise, timeoutPromise]);

  if (mongoose.connection.readyState !== 1) {
    throw new Error(
      `MongoDB not connected (readyState: ${mongoose.connection.readyState})`,
    );
  }

  console.log("Querying orders...");
  const orders = await Order.find({}).sort({ updatedAt: -1 }).limit(10);

  console.log(`Found ${orders.length} orders total`);
  orders.forEach((o) => {
    console.log("-----------------------------------------");
    console.log(`OrderId: ${o.orderId}`);
    console.log(`Status: ${o.orderStatus}`);
    console.log(`ShiprocketOrderId: ${o.shiprocketOrderId}`);
    console.log(`ShiprocketShipmentId: ${o.shiprocketShipmentId}`);
    console.log(`AWBCode: ${o.awbCode}`);
    console.log(`PickupToken: ${o.pickupToken}`);
    console.log(`ManifestUrl: ${o.manifestUrl}`);
    console.log(`LabelUrl: ${o.shippingLabelUrl}`);
    console.log(`InvoiceUrl: ${o.shippingInvoiceUrl}`);
    console.log(`InternalNotes:\n${o.internalNotes}`);
  });
  await mongoose.connection.close();
};

checkStatus().catch((err) => {
  console.error("Diagnostic Error:", err.message);
  mongoose.connection.close().catch(() => {});
  process.exit(1);
});
