import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import { createOrder } from "../controllers/orderController.js";

describe("Special Offer Backend Validation and Pricing Rules", () => {
  // Save originals to restore later
  const originalProductFindById = Product.findById;
  const originalOrderCountDocuments = Order.countDocuments;
  const originalOrderCreate = Order.create;
  const originalCouponFindOne = Coupon.findOne;

  // Local state for stub configuration
  let mockDeliveredCount = 0;
  let mockProduct = {
    _id: "prod-123",
    name: "Luxury Silk Kurta",
    sku: "KURTA-SILK-M",
    price: 2000,
    gst: 5,
    sizesStock: { M: 10 },
    get: (key) => 10,
    set: () => {},
    save: async () => {},
  };
  let mockCoupon = null;

  before(() => {
    // Stub Product.findById
    Product.findById = async (id) => {
      return { ...mockProduct, _id: id };
    };

    // Stub Order.countDocuments
    Order.countDocuments = async (filter) => {
      if (filter.orderStatus === "Delivered") {
        return mockDeliveredCount;
      }
      return 0;
    };

    // Stub Order.create
    Order.create = async (payload) => {
      return {
        ...payload,
        _id: "mocked-order-id-999",
        toObject: function () {
          return this;
        },
        save: async function () {
          return this;
        },
      };
    };

    // Stub Coupon.findOne
    Coupon.findOne = async (filter) => {
      if (mockCoupon && filter.code === mockCoupon.code.toUpperCase()) {
        return mockCoupon;
      }
      return null;
    };
  });

  after(async () => {
    // Restore original functions
    Product.findById = originalProductFindById;
    Order.countDocuments = originalOrderCountDocuments;
    Order.create = originalOrderCreate;
    Coupon.findOne = originalCouponFindOne;

    // Disconnect mongoose to ensure test process exits cleanly
    await mongoose.disconnect();

    // Force exit to prevent Node runner from hanging on unclosed handles
    setTimeout(() => {
      process.exit(0);
    }, 100);
  });

  beforeEach(() => {
    mockDeliveredCount = 0;
    mockCoupon = null;
  });

  const makeMockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (payload) => {
      res.body = payload;
      return res;
    };
    return res;
  };

  const getBaseReq = (paymentMethod = "COD") => ({
    user: { _id: "user-456", phone: "9876543210", role: "customer" },
    body: {
      items: [
        {
          productId: "prod-123",
          name: "Luxury Silk Kurta",
          sku: "KURTA-SILK-M",
          price: 2000,
          quantity: 1,
          size: "M",
        },
      ],
      shippingAddress: {
        fullName: "John Doe",
        phone: "9876543210",
        street: "101 Royal Lane",
        city: "Jodhpur",
        state: "Rajasthan",
        pincode: "342001",
      },
      paymentMethod,
      pricing: {
        subtotal: 2000,
        delivery: 0,
        gst: 100,
        discount: 0,
        grandTotal: 2000,
      },
    },
  });

  it("should apply 0% discount for a new customer choosing COD", async () => {
    mockDeliveredCount = 0;
    const req = getBaseReq("COD");
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.pricing.discount, 0);
    assert.equal(res.body.data.pricing.gst, 95); // Dynamic GST: calculated inclusive dynamic GST (2000 * 5/105 = 95)
    assert.equal(res.body.data.pricing.grandTotal, 2000);
    assert.equal(res.body.data.items[0].gstRate, 5);
    assert.equal(res.body.data.items[0].gstAmount, 95);
    assert.equal(res.body.data.pricing.specialOffer, undefined);
  });

  it("should apply 5% discount for a new customer choosing Online / Prepaid payment", async () => {
    mockDeliveredCount = 0;
    const req = getBaseReq("ONLINE");
    // Client sent 5% discount info
    req.body.pricing.discount = 100;
    req.body.pricing.grandTotal = 1900;
    req.body.pricing.specialOffer = {
      type: "PREPAID_5",
      discountPercent: 5,
    };
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.pricing.discount, 100);
    assert.equal(res.body.data.pricing.gst, 90); // 1900 * 5/105 = 90.47 (approx 90)
    assert.equal(res.body.data.pricing.grandTotal, 1900);
    assert.equal(res.body.data.items[0].gstRate, 5);
    assert.equal(res.body.data.items[0].gstAmount, 90);
    assert.equal(res.body.data.pricing.specialOffer.type, "PREPAID_5");
  });

  it("should apply 15% discount for 5th purchase (4 delivered orders count) in COD", async () => {
    mockDeliveredCount = 4; // Exactly 4 Delivered orders beforehand
    const req = getBaseReq("COD");
    // Client sent 15% discount
    req.body.pricing.discount = 300;
    req.body.pricing.grandTotal = 1700;
    req.body.pricing.specialOffer = {
      type: "FIFTH_PURCHASE_15",
      discountPercent: 15,
    };
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.pricing.discount, 300);
    assert.equal(res.body.data.pricing.gst, 81); // 1700 * 5/105 = 80.95 (approx 81)
    assert.equal(res.body.data.pricing.grandTotal, 1700);
    assert.equal(res.body.data.items[0].gstRate, 5);
    assert.equal(res.body.data.items[0].gstAmount, 81);
    assert.equal(res.body.data.pricing.specialOffer.type, "FIFTH_PURCHASE_15");
  });

  it("should enforce higher discount (15% fifth purchase) instead of prepaid 5% if eligible for both", async () => {
    mockDeliveredCount = 4; // Eligible for fifth purchase (15%)
    const req = getBaseReq("ONLINE"); // Also eligible for prepaid (5%)

    // Stacking is not allowed: 15% is the optimal choice since it is higher
    req.body.pricing.discount = 300;
    req.body.pricing.grandTotal = 1700;
    req.body.pricing.specialOffer = {
      type: "FIFTH_PURCHASE_15",
      discountPercent: 15,
    };
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.pricing.discount, 300);
    assert.equal(res.body.data.pricing.gst, 81);
    assert.equal(res.body.data.pricing.grandTotal, 1700);
    assert.equal(res.body.data.pricing.specialOffer.type, "FIFTH_PURCHASE_15");
  });

  it("should block order placement if client attempts to forge special offer discount they are not eligible for", async () => {
    mockDeliveredCount = 0; // Not eligible for 5th purchase (15%)
    const req = getBaseReq("COD");

    // Client forged 15% discount
    req.body.pricing.discount = 300;
    req.body.pricing.grandTotal = 1700;
    req.body.pricing.specialOffer = {
      type: "FIFTH_PURCHASE_15",
      discountPercent: 15,
    };
    const res = makeMockRes();

    await createOrder(req, res);

    // Fail validation
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes("Unauthorized special offer"));
  });

  it("should disable special offer and apply only Coupon discount if a coupon is applied manually", async () => {
    mockDeliveredCount = 4; // Eligible for 5th purchase (15%)
    mockCoupon = {
      code: "FESTIVE10",
      discountType: "Percentage",
      value: 10,
      status: "Active",
      ordersUsed: 0,
      save: async () => {},
    };

    const req = getBaseReq("COD");
    // Client sent 10% coupon (₹200 discount) and no special offer
    req.body.pricing.appliedCoupon = "FESTIVE10";
    req.body.pricing.discount = 200;
    req.body.pricing.grandTotal = 1800;
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.pricing.discount, 200);
    assert.equal(res.body.data.pricing.gst, 86); // 1800 * 5/105 = 85.71 (approx 86)
    assert.equal(res.body.data.pricing.appliedCoupon, "FESTIVE10");
    assert.equal(res.body.data.pricing.specialOffer, undefined);
  });

  it("should enforce minQuantity coupon validation and throw error if not met", async () => {
    mockCoupon = {
      code: "SUMMER10",
      discountType: "Percentage",
      value: 10,
      status: "Active",
      minQuantity: 2,
      ordersUsed: 0,
      save: async () => {},
    };

    const req = getBaseReq("COD");
    req.body.pricing.appliedCoupon = "SUMMER10";
    req.body.items[0].quantity = 1; // 1 item < minQuantity 2
    req.body.pricing.discount = 200;
    req.body.pricing.grandTotal = 1800;
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes("requires a minimum of 2 items"));
  });

  it("should allow minQuantity coupon validation if quantity is met", async () => {
    mockCoupon = {
      code: "SUMMER10",
      discountType: "Percentage",
      value: 10,
      status: "Active",
      minQuantity: 2,
      ordersUsed: 0,
      save: async () => {},
    };

    const req = getBaseReq("COD");
    req.body.pricing.appliedCoupon = "SUMMER10";
    req.body.items[0].quantity = 2; // matches minQuantity 2
    req.body.pricing.subtotal = 4000;
    req.body.pricing.discount = 400;
    req.body.pricing.grandTotal = 3600;
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.pricing.discount, 400);
  });

  it("should enforce minAmount coupon validation and throw error if subtotal not met", async () => {
    mockCoupon = {
      code: "GIFT5000",
      discountType: "Flat",
      value: 0,
      status: "Active",
      minAmount: 5000,
      ordersUsed: 0,
      save: async () => {},
    };

    const req = getBaseReq("COD");
    req.body.pricing.appliedCoupon = "GIFT5000";
    req.body.pricing.subtotal = 2000; // subtotal 2000 < minAmount 5000
    req.body.pricing.discount = 0;
    req.body.pricing.grandTotal = 2000;
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(
      res.body.message.includes("requires a minimum order amount of ₹5000"),
    );
  });

  it("should cap percentage discounts at maxDiscount successfully", async () => {
    mockCoupon = {
      code: "BIGSAVE",
      discountType: "Percentage",
      value: 50, // 50%
      status: "Active",
      maxDiscount: 500, // max 500 off
      ordersUsed: 0,
      save: async () => {},
    };

    const req = getBaseReq("COD");
    req.body.pricing.appliedCoupon = "BIGSAVE";
    req.body.pricing.subtotal = 2000; // 50% is 1000, capped to 500
    req.body.pricing.discount = 500;
    req.body.pricing.grandTotal = 1500;
    const res = makeMockRes();

    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.pricing.discount, 500);
  });

  it("should automatically bundle active surprise gift if order subtotal satisfies threshold criteria", async () => {
    const originalCouponFindOne = Coupon.findOne;
    Coupon.findOne = async (filter) => {
      if (filter.offerType === "SURPRISE_GIFT" && filter.status === "Active") {
        return {
          code: "GIFT5000",
          name: "SURPRISE GIFT",
          description:
            "Shop for ₹5,000+ and unlock a surprise gift worth ₹2,000",
          giftValue: 2000,
          minAmount: 5000,
        };
      }
      return null;
    };

    const req = getBaseReq("COD");
    req.body.items[0].quantity = 3;
    req.body.pricing.subtotal = 6000;
    req.body.pricing.grandTotal = 6000;
    const res = makeMockRes();

    await createOrder(req, res);

    Coupon.findOne = originalCouponFindOne; // restore quickly

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.pricing.surpriseGift);
    assert.equal(res.body.data.pricing.surpriseGift.giftValue, 2000);
  });
});
