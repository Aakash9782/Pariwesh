import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import EmailLog from "../models/EmailLog.js";
import Setting from "../models/Setting.js";
import { emailOrderStatusUpdate } from "../utils/orderEmails.js";
import { buildOrderStatusUpdateEmail } from "../utils/emailTemplates.js";

describe("Order Status Email Notifications with Settings Support", () => {
  const originalCreate = EmailLog.create;
  const originalFind = Setting.find;
  const originalFetch = globalThis.fetch;

  let lastLoggedPayload = null;
  let fetchCalls = [];
  let settingsMockValue = [];

  before(() => {
    // Stub Mongo EmailLog persistence
    EmailLog.create = async (payload) => {
      lastLoggedPayload = payload;
      return { ...payload, _id: "mock-log-id" };
    };

    // Stub Setting find
    Setting.find = async () => {
      if (settingsMockValue === "throw") {
        throw new Error("DB Connection Lost");
      }
      return settingsMockValue;
    };

    // Mock global fetch
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return new Response(JSON.stringify({ messageId: "status-msg-123" }), {
        status: 200,
      });
    };
  });

  after(() => {
    // Restore stubs
    EmailLog.create = originalCreate;
    Setting.find = originalFind;
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    lastLoggedPayload = null;
    fetchCalls = [];
    settingsMockValue = [
      { key: "brandName", value: "CUSTOM BRAND" },
      { key: "supportEmail", value: "support@custombrand.com" },
      { key: "brandLogoUrl", value: "https://custombrand.com/logo.png" },
    ];
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.EMAIL_API_KEY = "test-api-key-123";
    process.env.EMAIL_FROM_ADDRESS = "test@custombrand.com";
    process.env.EMAIL_FROM_NAME = "CUSTOM BRAND";
    process.env.EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";
  });

  const mockOrder = {
    orderId: "PRW-2026-99999",
    createdAt: new Date(),
    customer: {
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
    },
    shippingAddress: {
      fullName: "John Doe",
      phone: "9876543210",
      street: "123 Main St",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    },
    items: [
      {
        productId: "prod1",
        name: "Classic Silk Suit",
        sku: "SLK-SUIT-M",
        price: 2500,
        quantity: 1,
        size: "M",
      },
    ],
    pricing: {
      subtotal: 2500,
      grandTotal: 2500,
    },
    paymentMethod: "COD",
    paymentStatus: "Pending",
    orderStatus: "Processing",
    trackingId: "",
    shippingProvider: "",
  };

  it("should generate email content using settings values", () => {
    const settings = {
      brandName: "CUSTOM BRAND",
      supportEmail: "support@custombrand.com",
      brandLogoUrl: "https://custombrand.com/logo.png",
    };
    const { subject, html } = buildOrderStatusUpdateEmail(mockOrder, settings);

    assert.ok(subject.includes("CUSTOM BRAND"));
    assert.ok(html.includes("CUSTOM BRAND"));
    assert.ok(html.includes("https://custombrand.com/logo.png"));
    assert.ok(html.includes("support@custombrand.com"));
  });

  it("should gracefully fallback to default values if settings are missing", () => {
    const { subject, html } = buildOrderStatusUpdateEmail(mockOrder, null);

    assert.ok(subject.includes("PARIWESH"));
    assert.ok(html.includes("PARIWESH"));
    assert.ok(html.includes("contact@pariwesh.co"));
  });

  it("should safely compile tracking block ONLY for allowed statuses", () => {
    const settings = {};

    // Processing should NOT have tracking details
    const resProcessing = buildOrderStatusUpdateEmail(
      {
        ...mockOrder,
        orderStatus: "Processing",
        trackingId: "AWB123",
        shippingProvider: "DHL",
      },
      settings,
    );
    assert.ok(!resProcessing.html.includes("Delivery Details"));
    assert.ok(!resProcessing.html.includes("Track Order"));

    // Shipped SHOULD have tracking details if available
    const resShipped = buildOrderStatusUpdateEmail(
      {
        ...mockOrder,
        orderStatus: "Shipped",
        trackingId: "AWB123",
        shippingProvider: "DHL",
      },
      settings,
    );
    assert.ok(resShipped.html.includes("Delivery Details"));
    assert.ok(resShipped.html.includes("AWB123"));
    assert.ok(resShipped.html.includes("Track Order"));
  });

  it("should execute emailOrderStatusUpdate and load Settings collection dynamically", async () => {
    await emailOrderStatusUpdate(mockOrder);

    assert.equal(fetchCalls.length, 1);
    assert.ok(lastLoggedPayload);
    assert.equal(lastLoggedPayload.status, "sent");
    assert.equal(lastLoggedPayload.type, "other");
  });

  it("should gracefully handle DB failures in settings query and send the email with fallbacks", async () => {
    settingsMockValue = "throw";
    await emailOrderStatusUpdate(mockOrder);

    assert.equal(fetchCalls.length, 1);
    assert.ok(lastLoggedPayload);
    assert.equal(lastLoggedPayload.status, "sent");
  });
});
