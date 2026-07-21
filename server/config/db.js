import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);

    // Listen for disconnections
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB connection lost. Attempting reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    console.error(`❌ Error connecting to database: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
