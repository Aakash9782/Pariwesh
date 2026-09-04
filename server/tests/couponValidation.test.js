import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import { validateCoupon } from "../controllers/couponController.js";

describe("Coupon Validation Endpoint Controller Tests", () => {
  const originalCouponFindOne = Coupon.findOne;
  const originalProductFindById = Product.findById;

  let mockCoupon = null;

  before(() => {
    Coupon.findOne = async (filter) => {
      if (mockCoupon && filter.code === mockCoupon.code) {
        return mockCoupon;
      }
      return null;
    };

    Product.findById = async (id) => {
      return { _id: id, price: 1500 };
    };
  });

  after(() => {
    Coupon.findOne = originalCouponFindOne;
    Product.findById = originalProductFindById;
  });

  const createMockRes = () => {
    const res = {
      statusCode: 200,
      body: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.body = payload;
        return this;
      },
    };
    return res;
  };

  it("returns 400 when coupon code is missing", async () => {
    const req = { body: {} };
    const res = createMockRes();

    await validateCoupon(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /provide a coupon code/i);
  });

  it("returns 404 when coupon is not found", async () => {
    mockCoupon = null;
    const req = { body: { code: "NONEXISTENT" } };
    const res = createMockRes();

    await validateCoupon(req, res);
    assert.equal(res.statusCode, 404);
  });

  it("enforces minQuantity and fails when client quantity < minQuantity", async () => {
    mockCoupon = {
      code: "SAWANSALE",
      status: "Active",
      discountType: "Percentage",
      value: 10,
      minQuantity: 2,
      ordersUsed: 0,
      usageLimit: 999,
    };

    const req = {
      body: {
        code: "SAWANSALE",
        subtotal: 2000,
        quantity: 1, // Only 1 item
      },
    };
    const res = createMockRes();

    await validateCoupon(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /minimum of 2 items/i);
  });

  it("successfully validates coupon when quantity satisfies minQuantity", async () => {
    mockCoupon = {
      code: "SAWANSALE",
      status: "Active",
      discountType: "Percentage",
      value: 10,
      minQuantity: 2,
      ordersUsed: 0,
      usageLimit: 999,
    };

    const req = {
      body: {
        code: "SAWANSALE",
        subtotal: 3000,
        quantity: 2,
      },
    };
    const res = createMockRes();

    await validateCoupon(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.discountAmount, 300);
    assert.equal(res.body.data.minQuantity, 2);
  });

  it("computes totalQty and validates successfully from items array", async () => {
    mockCoupon = {
      code: "PARIWESH15",
      status: "Active",
      discountType: "Percentage",
      value: 15,
      minQuantity: 5,
      ordersUsed: 0,
      usageLimit: 999,
    };

    const req = {
      body: {
        code: "PARIWESH15",
        subtotal: 7500,
        items: [
          { productId: "p1", quantity: 3 },
          { productId: "p2", quantity: 2 },
        ],
      },
    };
    const res = createMockRes();

    await validateCoupon(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.value, 15);
  });
});
