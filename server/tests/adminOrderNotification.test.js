import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import EmailLog from "../models/EmailLog.js";
import { emailOrderPlaced, emailPaymentSuccess } from "../utils/orderEmails.js";

describe("Admin Successful Order Email Notifications", () => {
  const originalCreate = EmailLog.create;
  const originalFetch = globalThis.fetch;

  let lastLoggedPayloads = [];
  let fetchCalls = [];

  before(() => {
    // Stub Mongo EmailLog persistence
    EmailLog.create = async (payload) => {
      lastLoggedPayloads.push(payload);
      return { ...payload, _id: "mock-log-id" };
    };

    // Mock global fetch
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return new Response(JSON.stringify({ messageId: "msg-abc-123" }), {
        status: 200,
      });
    };
  });

  after(() => {
    // Restore stubs
    EmailLog.create = originalCreate;
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    lastLoggedPayloads = [];
    fetchCalls = [];

    // Clear and set config env values
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.EMAIL_API_KEY = "test-api-key-xyz";
    process.env.EMAIL_FROM_ADDRESS = "notification@pariwesh.com";
    process.env.EMAIL_FROM_NAME = "PARIWESH";
    process.env.EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";

    // Set default admin email configuration
    process.env.ADMIN_EMAILS = "admin1@pariwesh.com,admin2@pariwesh.com";
  });

  const mockCodOrder = {
    orderId: "PRW-2026-COD12",
    createdAt: new Date(),
    customer: {
      name: "COD Customer",
      email: "cod_customer@example.com",
      phone: "9876543210",
    },
    shippingAddress: {
      fullName: "COD Customer Address",
      phone: "9876543210",
      street: "123 Main St",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    },
    items: [
      {
        productId: "prod1",
        name: "Festive Lehenga",
        sku: "FST-LEH-M",
        price: 3500,
        quantity: 1,
        size: "M",
      },
    ],
    pricing: {
      subtotal: 3500,
      grandTotal: 3500,
    },
    paymentMethod: "COD",
    paymentStatus: "Pending",
    orderStatus: "Placed",
  };

  const mockOnlineOrder = {
    ...mockCodOrder,
    orderId: "PRW-2026-ONL34",
    customer: {
      name: "Online Customer",
      email: "online@example.com",
      phone: "9876543210",
    },
    paymentMethod: "ONLINE",
  };

  it("should trigger admin notification immediately upon emailOrderPlaced for COD order", async () => {
    await emailOrderPlaced(mockCodOrder);

    // Should send 3 emails: 1 to customer, 2 to admins
    assert.equal(fetchCalls.length, 3);

    // Verify customer email
    const customerCall = fetchCalls.find(
      (c) =>
        JSON.parse(c.options.body).to[0].email === "cod_customer@example.com",
    );
    assert.ok(customerCall);
    assert.ok(
      JSON.parse(customerCall.options.body).subject.includes(
        "Order PRW-2026-COD12 placed",
      ),
    );

    // Verify admin emails
    const admin1Call = fetchCalls.find(
      (c) => JSON.parse(c.options.body).to[0].email === "admin1@pariwesh.com",
    );
    const admin2Call = fetchCalls.find(
      (c) => JSON.parse(c.options.body).to[0].email === "admin2@pariwesh.com",
    );

    assert.ok(admin1Call);
    assert.ok(admin2Call);

    const body1 = JSON.parse(admin1Call.options.body);
    assert.ok(
      body1.subject.includes("[New Order] PRW-2026-COD12 Confirmed (COD)"),
    );
    assert.ok(body1.htmlContent.includes("Hello Admin"));
    assert.ok(body1.htmlContent.includes("Festive Lehenga"));
  });

  it("should NOT trigger admin notification upon emailOrderPlaced for ONLINE order (still pending payment)", async () => {
    await emailOrderPlaced(mockOnlineOrder);

    // Should only send 1 email: to the customer
    assert.equal(fetchCalls.length, 1);

    const customerCall = fetchCalls[0];
    assert.equal(
      JSON.parse(customerCall.options.body).to[0].email,
      "online@example.com",
    );
  });

  it("should trigger admin notification upon emailPaymentSuccess for ONLINE order", async () => {
    await emailPaymentSuccess(mockOnlineOrder);

    // Should send 3 emails: 1 to customer (payment success), 2 to admins
    assert.equal(fetchCalls.length, 3);

    // Verify customer payment success email
    const customerCall = fetchCalls.find(
      (c) => JSON.parse(c.options.body).to[0].email === "online@example.com",
    );
    assert.ok(customerCall);
    assert.ok(
      JSON.parse(customerCall.options.body).subject.includes(
        "Payment received for PRW-2026-ONL34",
      ),
    );

    // Verify admin emails
    const admin1Call = fetchCalls.find(
      (c) => JSON.parse(c.options.body).to[0].email === "admin1@pariwesh.com",
    );
    const admin2Call = fetchCalls.find(
      (c) => JSON.parse(c.options.body).to[0].email === "admin2@pariwesh.com",
    );

    assert.ok(admin1Call);
    assert.ok(admin2Call);

    const body1 = JSON.parse(admin1Call.options.body);
    assert.ok(
      body1.subject.includes("[New Order] PRW-2026-ONL34 Confirmed (ONLINE)"),
    );
    assert.ok(body1.htmlContent.includes("Hello Admin"));
  });

  it("should gracefully handle missing or empty ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "";

    await emailOrderPlaced(mockCodOrder);

    // Only customer email should be sent, admin emails skipped
    assert.equal(fetchCalls.length, 1);
    assert.equal(
      JSON.parse(fetchCalls[0].options.body).to[0].email,
      "cod_customer@example.com",
    );
  });
});
