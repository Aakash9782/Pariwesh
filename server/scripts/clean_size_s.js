import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

const cleanSizeS = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not defined in environment");
    }

    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database Connected.");

    // First: Purge any 'S' field from sizesStock at collection level
    await Product.collection.updateMany(
      {},
      {
        $unset: { "sizesStock.S": "" },
      },
    );
    console.log("🧹 $unset sizesStock.S executed on all documents.");

    const products = await Product.find({});
    console.log(`🔍 Found ${products.length} products to verify.`);

    const brandSizes = ["M", "L", "XL", "XXL"];
    let updatedCount = 0;

    for (const product of products) {
      // 1. Force exact sizes array: M, L, XL, XXL
      product.sizes = [...brandSizes];

      // 2. Normalize sizesStock
      const currentStock = product.sizesStock
        ? product.sizesStock.toObject
          ? product.sizesStock.toObject()
          : { ...product.sizesStock }
        : {};

      delete currentStock.S;

      product.sizesStock = {
        M: Number(currentStock.M ?? 10),
        L: Number(currentStock.L ?? 10),
        XL: Number(currentStock.XL ?? 10),
        XXL: Number(currentStock.XXL ?? 10),
      };

      // 3. Ensure sizeChart exists
      if (!product.sizeChart || !product.sizeChart.type) {
        product.sizeChart = {
          type: "table",
          imageUrl: "",
          measurements: [],
        };
      }

      product.markModified("sizes");
      product.markModified("sizesStock");
      product.markModified("sizeChart");
      await product.save();
      updatedCount++;
    }

    console.log(
      `🎉 Successfully standardized ${updatedCount} products to sizes: [M, L, XL, XXL]!`,
    );

    // Verify one sample product
    const sample = await Product.findOne({
      slug: "mal-cotton-embroidered-farshi-salwar-set",
    });
    if (sample) {
      console.log(`Sample verification (${sample.slug}):`);
      console.log("  sizes:", sample.sizes);
      console.log("  sizesStock:", sample.sizesStock);
    }

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  }
};

cleanSizeS();
