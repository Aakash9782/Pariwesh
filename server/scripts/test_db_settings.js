import mongoose from "mongoose";
import dotenv from "dotenv";
import Setting from "./models/Setting.js";

dotenv.config();

const run = async () => {
  try {
    console.log("Connecting database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected! Fetching settings...");
    const list = await Setting.find({});
    console.log("Settings list length:", list.length);
    console.log("Settings list details:", JSON.stringify(list, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("DB Fetch Error:", err);
    process.exit(1);
  }
};

run();
