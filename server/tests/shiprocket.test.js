import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Order from "../models/Order.js";
import Setting from "../models/Setting.js";
import mongoose from "mongoose";
import {
  getShiprocketToken,
  createShiprocketOrder,
  assignShiprocketAWB,
  getCourierRecommendations,
} from "../utils/shiprocket.js";

describe("Shiprocket Courier Integration and Webhooks", () => {
  const originalFetch = globalThis.fetch;
  const originalFindOne = Order.findOne;
  const originalSettingFind = Setting.find;

  let fetchCalls = [];
  let dbUpdates = [];
  let dbMockOrder = null;

  before(() => {
    Setting.find = async () => [];
    // Stub global fetch
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options });

      // Match auth/login request
      if (url.includes("/v1/external/auth/login")) {
        return new Response(JSON.stringify({ token: "stub-jwt-token-12345" }), {
          status: 200,
        });
      }

      // Match order/create request
      if (url.includes("/v1/external/orders/create/adhoc")) {
        return new Response(
          JSON.stringify({
            order_id: "SR-998877",
            shipment_id: "SR-SHIP-112233",
          }),
          { status: 200 },
        );
      }

      // Match courier recommendation
      if (url.includes("/v1/external/courier/serviceability/")) {
        return new Response(
          JSON.stringify({
            data: {
              available_courier_companies: [
                {
                  courier_company_id: "10",
                  courier_name: "BlueDart",
                  rate: "250",
                },
                {
                  courier_company_id: "20",
                  courier_name: "Delhivery",
                  rate: "120",
                },
              ],
            },
          }),
          { status: 200 },
        );
      }

      // Match AWB assignment
      if (url.includes("/v1/external/courier/assign/awb")) {
        return new Response(
          JSON.stringify({
            data: {
              response: {
                awb_code: "AWB-CODE-778899",
                courier_name: "BlueDart",
                courier_company_id: "10",
              },
            },
          }),
          { status: 200 },
        );
      }

      // Fallback
      return new Response(JSON.stringify({}), { status: 200 });
    };

    // Stub Mongoose Order query
    Order.findOne = async (query) => {
      if (
        dbMockOrder &&
        (query.$or[0].orderId === dbMockOrder.orderId ||
          query.$or[1].shiprocketOrderId === dbMockOrder.shiprocketOrderId)
      ) {
        return dbMockOrder;
      }
      return null;
    };
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    Order.findOne = originalFindOne;
    Setting.find = originalSettingFind;
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(() => {
    fetchCalls = [];
    dbUpdates = [];

    // Setup initial mock order structure
    dbMockOrder = {
      orderId: "PRW-2026-TEST",
      shiprocketOrderId: "SR-998877",
      orderStatus: "Ready to Ship",
      awbCode: "",
      trackingId: "",
      shippingProvider: "",
      internalNotes: "",
      deliveredAt: null,
      save: async function () {
        dbUpdates.push({ ...this });
        return this;
      },
    };

    // Ensure environment keys are set for testing
    process.env.SHIPROCKET_EMAIL = "test@pariwesh.co";
    process.env.SHIPROCKET_PASSWORD = "test-password-123";
    process.env.SHIPROCKET_WEBHOOK_SECRET = "secure-webhook-secret-token";
    process.env.SHIPROCKET_PICKUP_LOCATION = "Primary Warehouse";
  });

  it("should fetch authentication JWT and cache it", async () => {
    const token = await getShiprocketToken();
    assert.equal(token, "stub-jwt-token-12345");
    assert.ok(fetchCalls.length > 0);
    assert.ok(fetchCalls[0].url.includes("/v1/external/auth/login"));

    // Check caching: second request shouldn't trigger fetch call if token not expired
    fetchCalls = [];
    const cached = await getShiprocketToken();
    assert.equal(cached, "stub-jwt-token-12345");
    assert.equal(fetchCalls.length, 0);
  });

  it("should format payloads accurately and register orders adhoc in Shiprocket", async () => {
    const mockOrderInstance = {
      orderId: "PRW-2026-ORDER",
      createdAt: new Date(),
      customer: {
        name: "Aashu Sharma",
        email: "aashu@pariwesh.co",
        phone: "9876543210",
      },
      shippingAddress: {
        street: "123 Pink City",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        phone: "9876543210",
      },
      items: [
        { name: "Cotton Kurta", sku: "KRT-COT-M", price: 1500, quantity: 1 },
      ],
      paymentMethod: "COD",
      pricing: { subtotal: 1500, grandTotal: 1500 },
    };

    const details = await createShiprocketOrder(mockOrderInstance);
    assert.equal(details.shiprocketOrderId, "SR-998877");
    assert.equal(details.shiprocketShipmentId, "SR-SHIP-112233");
  });

  it("should query serviceability recommendations and select best rating option", async () => {
    const recommend = await getCourierRecommendations("SR-SHIP-112233");
    assert.ok(recommend);
    assert.equal(recommend.courier_name, "BlueDart");
    assert.equal(recommend.courier_company_id, "10");
  });

  it("should assign AWB numbers tracking details to order object", async () => {
    const response = await assignShiprocketAWB("SR-SHIP-112233", "10");
    assert.equal(response.awbCode, "AWB-CODE-778899");
    assert.equal(response.courierName, "BlueDart");
    assert.equal(response.courierId, "10");
  });

  it("should reject unauthorized webhooks lacking secret matching token with 401", async () => {
    let responseStatus = 200;
    let responseBody = {};
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };
    const req = {
      headers: { "x-webhook-token": "wrong-secret-token" },
      body: { order_id: "PRW-2026-TEST", current_status: "shipped" },
    };

    await (
      await import("../controllers/shippingController.js")
    ).handleShiprocketWebhook(req, res);

    assert.equal(responseStatus, 401);
    assert.equal(responseBody.success, false);
  });

  it("should parse webhook statuses mapping them to local Order status transitions", async () => {
    let responseStatus = 200;
    let responseBody = {};
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };
    const req = {
      headers: { "x-webhook-token": "secure-webhook-secret-token" },
      body: {
        order_id: "PRW-2026-TEST",
        awb: "AWB-777",
        current_status: "out for delivery",
        current_status_id: "7",
      },
    };

    await (
      await import("../controllers/shippingController.js")
    ).handleShiprocketWebhook(req, res);

    assert.equal(responseStatus, 200);
    assert.equal(responseBody.success, true);
    assert.ok(dbUpdates.length > 0);

    const lastUpdate = dbUpdates[dbUpdates.length - 1];
    assert.equal(lastUpdate.orderStatus, "Out for Delivery");
    assert.equal(lastUpdate.awbCode, "AWB-777");
    assert.equal(lastUpdate.trackingId, "AWB-777");
  });
});
