import ReturnRequest from "../models/ReturnRequest.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { logActivity } from "../utils/logger.js";
import { uploadBase64Image } from "../utils/cloudinaryUploader.js";

// @desc    Apply for Return (Customer)
// @route   POST /api/v1/returns
// @access  Private
export const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, items, reason, customerUploads, refundDetails } = req.body;

    if (!orderId || !items || items.length === 0 || !reason) {
      return sendError(res, "Missing required return parameters", 400);
    }

    if (
      reason !== "Damaged Product Received" &&
      reason !== "Wrong Product Received"
    ) {
      return sendError(
        res,
        "Invalid return reason. Only Damaged or Wrong Product allowed.",
        400,
      );
    }

    // 1. Fetch Order and verify ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    // Verify ownership (Admin can file returns, otherwise must be the customer)
    if (
      req.user.role !== "admin" &&
      order.customer.userId !== req.user._id.toString()
    ) {
      return sendError(
        res,
        "Unauthorized to request return for this order",
        403,
      );
    }

    // 2. Validate Order state
    if (order.orderStatus !== "Delivered") {
      return sendError(
        res,
        "Return is only allowed for delivered orders.",
        400,
      );
    }

    const deliveredDate = order.deliveredAt || order.updatedAt;
    const diffTime = Math.abs(Date.now() - new Date(deliveredDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      return sendError(
        res,
        "Return window has expired (7 days from delivery).",
        400,
      );
    }

    // 3. Validate items and quantities
    // Retrieve previous returns for this order to check duplicate / exceed quantities
    const existingReturns = await ReturnRequest.find({
      orderId,
      status: { $ne: "Return_Rejected" },
    });

    // Map items return count
    const returnedQuantities = {};
    existingReturns.forEach((ret) => {
      ret.items.forEach((item) => {
        const key = `${item.productId}_${item.size}`;
        returnedQuantities[key] =
          (returnedQuantities[key] || 0) + item.quantity;
      });
    });

    const parsedItems = [];
    for (const item of items) {
      // Find item in original order
      const orderItem = order.items.find(
        (oItem) =>
          oItem.productId === item.productId && oItem.size === item.size,
      );

      if (!orderItem) {
        return sendError(
          res,
          `Item ${item.name || item.sku} (Size: ${item.size}) was not part of original order.`,
          400,
        );
      }

      // Check max quantity allowed
      const key = `${item.productId}_${item.size}`;
      const alreadyReturned = returnedQuantities[key] || 0;
      if (alreadyReturned + item.quantity > orderItem.quantity) {
        return sendError(
          res,
          `Cannot return ${item.quantity} units of ${orderItem.name}. You have already requested return for ${alreadyReturned} out of ${orderItem.quantity} ordered units.`,
          400,
        );
      }

      parsedItems.push({
        productId: orderItem.productId,
        name: orderItem.name,
        sku: orderItem.sku,
        size: orderItem.size,
        quantity: item.quantity,
        price: orderItem.price,
      });
    }

    // 4. Validate Refund details based on payment method
    const finalRefundDetails = {
      method: order.paymentMethod === "ONLINE" ? "ORIGINAL_SOURCE" : "UPI",
      amount: parsedItems.reduce(
        (acc, curr) => acc + curr.price * curr.quantity,
        0,
      ),
      status: "Pending",
    };

    if (order.paymentMethod === "COD") {
      if (!refundDetails?.upiId?.trim()) {
        return sendError(res, "UPI ID is required for COD order returns.", 400);
      }
      finalRefundDetails.upiId = refundDetails.upiId.trim();
    }

    // 5. Upload base64 customer uploads if provided
    const uploadedImages = [];
    if (customerUploads && customerUploads.length > 0) {
      for (const img of customerUploads) {
        if (img.startsWith("data:image")) {
          const url = await uploadBase64Image(img, "pariwesh/returns");
          uploadedImages.push(url);
        } else {
          uploadedImages.push(img);
        }
      }
    }

    // 6. Generate returnId
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const returnId = `PRW-RET-${new Date().getFullYear()}-${randomNum}`;

    // 7. Create Return Request
    const returnRequest = await ReturnRequest.create({
      returnId,
      orderId: order._id,
      customerId: order.customer.userId || req.user._id,
      items: parsedItems,
      reason,
      status: "Return_Requested",
      evidenceTrail: {
        customerUploads: uploadedImages,
      },
      refundDetails: finalRefundDetails,
      timeline: {
        requestedAt: new Date(),
      },
    });

    // Update order status to Return_Requested
    order.orderStatus = "Return_Requested";
    await order.save();

    await logActivity(
      req,
      `Return Request Created: ${returnId} for Order: ${order.orderId}`,
    );

    return sendSuccess(
      res,
      "Return request submitted successfully",
      returnRequest,
      201,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get all Return Requests
// @route   GET /api/v1/returns
// @access  Private
export const getReturnRequests = async (req, res, next) => {
  try {
    const filter = {};

    // Non-admin can only see their own requests
    if (req.user.role !== "admin") {
      filter.customerId = req.user._id;
    } else {
      const { customerId, status } = req.query;
      if (customerId) filter.customerId = customerId;
      if (status) filter.status = status;
    }

    const returns = await ReturnRequest.find(filter)
      .populate("orderId", "orderId paymentMethod clientNotes")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Return requests retrieved successfully", returns);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get a single Return Request details
// @route   GET /api/v1/returns/:id
// @access  Private
export const getReturnRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const returnReq = await ReturnRequest.findById(id).populate("orderId");
    if (!returnReq) {
      return sendError(res, "Return request not found", 404);
    }

    if (
      req.user.role !== "admin" &&
      returnReq.customerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, "Unauthorized access", 403);
    }

    return sendSuccess(res, "Return request retrieved successfully", returnReq);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update Return Request status (Admin)
// @route   PUT /api/v1/returns/:id
// @access  Private (Admin only)
export const updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      rejectionReason,
      qcGrading,
      lossCategory,
      warehouseReceiptPhotos,
      qcPhotos,
      refundDetails,
    } = req.body;

    const returnReq = await ReturnRequest.findById(id);
    if (!returnReq) {
      return sendError(res, "Return request not found", 404);
    }

    const order = await Order.findById(returnReq.orderId);
    if (!order) {
      return sendError(res, "Pertaining order not found", 404);
    }

    // 1. Process Timeline and transitions
    if (status) {
      returnReq.status = status;
      order.orderStatus = status; // Sync orderStatus with returnStatus

      if (status === "Return_Approved") {
        returnReq.timeline.reviewedAt = new Date();
        returnReq.timeline.assignedAt = new Date();
      } else if (status === "Return_Rejected") {
        returnReq.timeline.reviewedAt = new Date();
        if (rejectionReason) returnReq.rejectionReason = rejectionReason;
        order.orderStatus = "Delivered"; // Revert order status back to Delivered
      } else if (status === "Return_In_Transit") {
        returnReq.timeline.pickedAt = new Date();
      } else if (status === "Return_Received") {
        returnReq.timeline.receivedAt = new Date();
      } else if (status === "Return_Disputed") {
        if (lossCategory) returnReq.lossCategory = lossCategory;
      } else if (status === "Return_Completed") {
        returnReq.timeline.qcCompletedAt = new Date();
        returnReq.timeline.refundCompletedAt = new Date();

        // Validate QC grading must be completed before Completing the return
        if (!qcGrading || !qcGrading.grade) {
          return sendError(
            res,
            "QC grading (A, B, C, or Scrap) is required to complete return.",
            400,
          );
        }

        returnReq.qcGrading = {
          grade: qcGrading.grade,
          remarks: qcGrading.remarks || "",
          inspectedBy: req.user.name || "Admin QC",
        };

        if (lossCategory) {
          returnReq.lossCategory = lossCategory;
        }

        // --- INVENTORY RESTOCK LOGIC ---
        // Restore stock ONLY if QC Grade is A_GRADE
        if (qcGrading.grade === "A_GRADE") {
          for (const item of returnReq.items) {
            const product = await Product.findById(item.productId);
            if (product) {
              const size = item.size || "M";
              const currentStock =
                Number(product.get(`sizesStock.${size}`)) || 0;
              product.set(
                `sizesStock.${size}`,
                currentStock + Number(item.quantity),
              );

              // Explicitly save the product (Mongoose validate syncs total stock automatically)
              await product.save();
            }
          }
        } else {
          // If not A_GRADE, require a valid loss category for finance tracking
          if (!lossCategory || lossCategory === "NA") {
            return sendError(
              res,
              "Loss category must be defined (Courier Damage, Customer Fraud, etc.) for non-A Grade returns.",
              400,
            );
          }
        }

        // --- REFUND INTEGRATION LOGIC ---
        // Complete the refund details
        returnReq.refundDetails.status = "Paid";
        order.paymentStatus = "Refunded";

        if (refundDetails?.transactionId) {
          returnReq.refundDetails.transactionId = refundDetails.transactionId;
        }
        if (refundDetails?.upiId) {
          returnReq.refundDetails.upiId = refundDetails.upiId;
        }
      }
    }

    // 2. Upload and append evidence photos if any passed
    if (warehouseReceiptPhotos && warehouseReceiptPhotos.length > 0) {
      const urls = [];
      for (const img of warehouseReceiptPhotos) {
        if (img.startsWith("data:image")) {
          const url = await uploadBase64Image(
            img,
            "pariwesh/returns/warehouse",
          );
          urls.push(url);
        } else {
          urls.push(img);
        }
      }
      returnReq.evidenceTrail.warehouseReceiptPhotos = [
        ...returnReq.evidenceTrail.warehouseReceiptPhotos,
        ...urls,
      ];
    }

    if (qcPhotos && qcPhotos.length > 0) {
      const urls = [];
      for (const img of qcPhotos) {
        if (img.startsWith("data:image")) {
          const url = await uploadBase64Image(img, "pariwesh/returns/qc");
          urls.push(url);
        } else {
          urls.push(img);
        }
      }
      returnReq.evidenceTrail.qcPhotos = [
        ...returnReq.evidenceTrail.qcPhotos,
        ...urls,
      ];
    }

    // 3. Allow manual UPI update at any stage before completion
    if (refundDetails?.upiId && returnReq.refundDetails.method === "UPI") {
      returnReq.refundDetails.upiId = refundDetails.upiId.trim();
    }
    if (refundDetails?.transactionId) {
      returnReq.refundDetails.transactionId =
        refundDetails.transactionId.trim();
    }

    await returnReq.save();
    await order.save();

    await logActivity(
      req,
      `Return Request Updated: ${returnReq.returnId} status is now ${returnReq.status}`,
    );

    return sendSuccess(res, "Return request updated successfully", returnReq);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
