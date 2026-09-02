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
  gstRate: {
    type: Number,
    default: 0,
  },
  gstAmount: {
    type: Number,
    default: 0,
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
      specialOffer: {
        type: {
          type: String,
        },
        discountPercent: Number,
      },
      surpriseGift: {
        name: String,
        description: String,
        giftValue: Number,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded", "Failed"],
      default: "Pending",
    },
    razorpayOrderId: {
      type: String,
      default: "",
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Confirmed",
        "Processing",
        "Packed",
        "Ready to Ship",
        "Pickup Scheduled",
        "Pickup Generated",
        "Pickup Completed",
        "In Transit",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
        "Refunded",
        "Return_Requested",
        "Return_Approved",
        "Return_In_Transit",
        "Return_Received",
        "Return_Completed",
        "Return_Disputed",
        "RTO Initiated",
        "RTO Delivered",
        "Lost",
        "Damaged",
        "Undelivered",
        "Exception",
      ],
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
    shiprocketOrderId: {
      type: String,
      default: "",
    },
    shiprocketShipmentId: {
      type: String,
      default: "",
    },
    awbCode: {
      type: String,
      default: "",
    },
    courierName: {
      type: String,
      default: "",
    },
    courierId: {
      type: String,
      default: "",
    },
    shippingLabelUrl: {
      type: String,
      default: "",
    },
    shippingInvoiceUrl: {
      type: String,
      default: "",
    },
    manifestUrl: {
      type: String,
      default: "",
    },
    pickupToken: {
      type: String,
      default: "",
    },
    pickupScheduledAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    customerNotes: {
      type: String,
      default: "",
    },
    internalNotes: {
      type: String,
      default: "",
    },
    currentTrackingStatus: {
      type: String,
      default: "",
    },
    currentTrackingTimestamp: {
      type: Date,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    lastWebhookReceivedAt: {
      type: Date,
    },
    deliveryHistory: [
      {
        status: String,
        activity: String,
        location: String,
        timestamp: Date,
      },
    ],
    metaTracking: {
      fbp: { type: String, default: "" },
      fbc: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", OrderSchema);
