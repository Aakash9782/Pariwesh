import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "stock_alert",
    },
    message: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      default: "",
    },
    productName: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", NotificationSchema);
