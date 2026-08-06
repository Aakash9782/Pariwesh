import mongoose from "mongoose";
import dotenv from "dotenv";
import Setting from "../models/Setting.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const list = await Setting.find({});
    console.log(
      "KEYS:",
      list.map((s) => s.key),
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
