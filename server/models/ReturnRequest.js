import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const returnRequestSchema = new mongoose.Schema(
  {
    returnId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [returnItemSchema],
    reason: {
      type: String,
      enum: ["Damaged Product Received", "Wrong Product Received"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Return_Requested",
        "Return_Approved",
        "Return_Rejected",
        "Return_In_Transit",
        "Return_Received",
        "Return_Completed",
        "Return_Disputed",
      ],
      default: "Return_Requested",
    },
    qcGrading: {
      grade: {
        type: String,
        enum: ["A_GRADE", "B_GRADE", "C_GRADE", "SCRAP", "PENDING"],
        default: "PENDING",
      },
      remarks: { type: String, default: "" },
      inspectedBy: { type: String, default: "" },
    },
    lossCategory: {
      type: String,
      enum: [
        "Courier_Damage",
        "Customer_Fraud",
        "Warehouse_Damage",
        "Lost_Parcel",
        "NA",
      ],
      default: "NA",
    },
    evidenceTrail: {
      customerUploads: { type: [String], default: [] },
      warehouseReceiptPhotos: { type: [String], default: [] },
      qcPhotos: { type: [String], default: [] },
    },
    timeline: {
      requestedAt: { type: Date, default: Date.now },
      reviewedAt: { type: Date },
      assignedAt: { type: Date },
      pickedAt: { type: Date },
      receivedAt: { type: Date },
      qcStartedAt: { type: Date },
      qcCompletedAt: { type: Date },
      refundInitiatedAt: { type: Date },
      refundCompletedAt: { type: Date },
    },
    refundDetails: {
      method: {
        type: String,
        enum: ["ORIGINAL_SOURCE", "UPI", "COUPON", "BANK_TRANSFER"],
      },
      upiId: { type: String, default: "" },
      amount: { type: Number, required: true },
      couponGenerated: { type: String, default: "" },
      transactionId: { type: String, default: "" },
      status: {
        type: String,
        enum: ["Pending", "Processing", "Paid", "On_Hold"],
        default: "Pending",
      },
    },
  },
  { timestamps: true },
);

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
export default ReturnRequest;
