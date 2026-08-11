import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const run = async () => {
  try {
    console.log("Connecting database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected! Fetching products...");
    const products = await Product.find({});
    console.log(`Found ${products.length} products total.`);

    console.log("\n--- Active/Draft Product Details ---");
    products.forEach((p) => {
      console.log(`- ID: ${p._id}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  SKU: ${p.sku}`);
      console.log(`  Slug: ${p.slug}`);
      console.log(`  Color: ${p.color}`);
      console.log(`  ColorHex: ${p.colorHex}`);
      console.log(`  ColorGroup: ${p.colorGroup || "(none)"}`);
      console.log(`  Status: ${p.status}`);
      console.log("------------------------");
    });

    process.exit(0);
  } catch (err) {
    console.error("DB Fetch Error:", err);
    process.exit(1);
  }
};

run();
