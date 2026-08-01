import mongoose from "mongoose";
import dotenv from "dotenv";
import Setting from "./models/Setting.js";

dotenv.config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    const settingsList = await Setting.find({});
    console.log("Current Database Settings:", settingsList);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
