import mongoose from "mongoose";

const EmailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
      index: true,
    },
    from: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "otp",
        "order_placed",
        "payment_success",
        "payment_failed",
        "order_shipped",
        "other",
      ],
      default: "other",
      index: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "skipped",
      index: true,
    },
    messageId: {
      type: String,
      default: "",
    },
    error: {
      type: String,
      default: "",
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    provider: {
      type: String,
      default: "smtp",
      index: true,
    },
    statusCode: {
      type: Number,
    },
    latencyMs: {
      type: Number,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

EmailLogSchema.index({ createdAt: -1 });

export default mongoose.model("EmailLog", EmailLogSchema);
