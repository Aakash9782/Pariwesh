import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in environment variables.");
      return;
    }
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
    // Do not call process.exit(1) so that backend doesn't crash on Render startup,
    // allowing API to serve readable JSON error responses instead of 502 Bad Gateway.
  }
};

export default connectDB;
