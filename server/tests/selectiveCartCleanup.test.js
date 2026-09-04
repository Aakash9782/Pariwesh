import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { createOrder } from "../controllers/orderController.js";

describe("Selective Cart Cleanup on Order Placement", () => {
  const originalProductFindById = Product.findById;
  const originalOrderCountDocuments = Order.countDocuments;
  const originalOrderCreate = Order.create;
  const originalCartFindOne = Cart.findOne;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const prod1Id = new mongoose.Types.ObjectId().toString();
  const prod2Id = new mongoose.Types.ObjectId().toString();

  let mockCart = null;
  let cartSaved = false;

  before(() => {
    Product.findById = async (id) => {
      return {
        _id: id,
        name: "Test Silk Kurta",
        sku: "TEST-SKU",
        price: 1500,
        gst: 0,
        sizes: ["M"],
        sizesStock: { M: 10 },
        get: () => 10,
        set: () => {},
        save: async () => {},
      };
    };

    Order.countDocuments = async () => 0;

    Order.create = async (payload) => {
      return {
        ...payload,
        _id: new mongoose.Types.ObjectId().toString(),
        toObject: function () {
          return this;
        },
        save: async function () {
          return this;
        },
      };
    };

    Coupon.findOne = async () => null;

    Cart.findOne = async (filter) => {
      if (mockCart && String(filter.user) === String(mockCart.user)) {
        return mockCart;
      }
      return null;
    };
  });

  after(() => {
    Product.findById = originalProductFindById;
    Order.countDocuments = originalOrderCountDocuments;
    Order.create = originalOrderCreate;
    Cart.findOne = originalCartFindOne;
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

  it("preserves unselected items in user's cart when only 1 of 2 items is ordered", async () => {
    cartSaved = false;
    mockCart = {
      user: testUserId,
      items: [
        {
          product: prod1Id,
          quantity: 1,
          size: "M",
          color: "Red",
          toObject: function () {
            return { ...this };
          },
        },
        {
          product: prod2Id,
          quantity: 2,
          size: "L",
          color: "Blue",
          toObject: function () {
            return { ...this };
          },
        },
      ],
      save: async function () {
        cartSaved = true;
      },
    };

    // User only buys prod1Id (1 item)
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(testUserId),
        name: "Test Buyer",
        role: "user",
      },
      body: {
        items: [
          {
            productId: prod1Id,
            name: "Test Silk Kurta",
            price: 1500,
            quantity: 1,
            size: "M",
            color: "Red",
          },
        ],
        shippingAddress: {
          fullName: "Test Buyer",
          phone: "9876543210",
          street: "123 Main St",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        pricing: {
          subtotal: 1500,
          delivery: 0,
          gst: 0,
          discount: 0,
          grandTotal: 1500,
        },
        paymentMethod: "COD",
      },
      headers: {},
    };

    const res = createMockRes();
    await createOrder(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(cartSaved, true, "Cart save should have been called");
    assert.equal(
      mockCart.items.length,
      1,
      "Only the purchased item should be removed",
    );
    assert.equal(
      String(mockCart.items[0].product),
      prod2Id,
      "The unpurchased prod2Id must stay in the cart",
    );
    assert.equal(
      mockCart.items[0].quantity,
      2,
      "Quantity of unpurchased item must be preserved",
    );
  });
});
