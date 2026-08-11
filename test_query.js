import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Setting from "./server/models/Setting.js";

dotenv.config({ path: "./server/.env" });

const run = async () => {
  let log = "";
  const addLog = (msg) => {
    console.log(msg);
    log += msg + "\n";
  };

  try {
    addLog(`MONGO_URI check: ${process.env.MONGO_URI ? "Present" : "Absent"}`);
    if (!process.env.MONGO_URI) {
      fs.writeFileSync("./db_result.txt", log + "\nERROR: MONGO_URI missing");
      process.exit(1);
    }
    addLog("Connecting Mongoose...");
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
    });
    addLog("Connected to MongoDB.");

    // Find settings
    const settings = await Setting.find({});
    addLog(`Total settings count: ${settings.length}`);
    settings.forEach((s) => {
      addLog(`Key: ${s.key}`);
      addLog(`Value: ${s.value}`);
      addLog("---");
    });
    await mongoose.connection.close();
    addLog("Closed Connection successfully.");
    fs.writeFileSync("./db_result.txt", log);
    process.exit(0);
  } catch (err) {
    addLog(`Error: ${err.message}`);
    fs.writeFileSync("./db_result.txt", log);
    process.exit(0);
  }
};

run();
