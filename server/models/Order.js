import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      userId: { type: String, default: "" },
      name: { type: String, required: true },
      email: { type: String, default: "" },
      phone: { type: String, required: true },
    },
    items: [OrderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, required: true },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      delivery: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
      appliedCoupon: { type: String, default: "" },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    trackingId: {
      type: String,
      default: "",
    },
    shippingProvider: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", OrderSchema);
