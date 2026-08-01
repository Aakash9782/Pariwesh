import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    adminName: {
      type: String,
      default: "System Admin",
    },
    action: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    device: {
      type: String,
      default: "Chrome / Windows",
    },
  },
  { timestamps: true },
);

export default mongoose.model("ActivityLog", ActivityLogSchema);
