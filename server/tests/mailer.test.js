import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import EmailLog from "../models/EmailLog.js";
import { sendMail, isMailConfigured } from "../utils/mailer.js";

describe("mailer Utility (Brevo REST API Mode)", () => {
  const originalCreate = EmailLog.create;
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;

  let lastLoggedPayload = null;
  let stubLogFailure = false;
  let fetchCalls = [];
  let mockFetchHandler = null;

  before(() => {
    // Stub Mongo EmailLog persistence
    EmailLog.create = async (payload) => {
      if (stubLogFailure) {
        throw new Error("MOCK DBNETWORK ERROR");
      }
      lastLoggedPayload = payload;
      return { ...payload, _id: "mock-id-123" };
    };

    // Mock global fetch
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      if (mockFetchHandler) {
        return mockFetchHandler(url, options);
      }
      return new Response(JSON.stringify({ messageId: "default-mock-id" }), {
        status: 200,
      });
    };

    // Accelerate timers (instant retry)
    globalThis.setTimeout = (fn, delay) => {
      // If it's the AbortController timeout, allow it to run normally
      if (delay === 10000 || delay === 1000) {
        return originalSetTimeout(fn, delay);
      }
      // Retry delays: resolve immediately (0ms)
      return originalSetTimeout(fn, 0);
    };
  });

  after(() => {
    // Restore stubs
    EmailLog.create = originalCreate;
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  });

  beforeEach(() => {
    lastLoggedPayload = null;
    stubLogFailure = false;
    fetchCalls = [];
    mockFetchHandler = null;

    // Reset env configuration
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.EMAIL_API_KEY = "test-api-key-123";
    process.env.EMAIL_FROM_ADDRESS = "test@pariwesh.com";
    process.env.EMAIL_FROM_NAME = "PARIWESH";
    process.env.EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";
    process.env.EMAIL_TIMEOUT_MS = "1000";
  });

  it("should successfully send email using Brevo REST API", async () => {
    mockFetchHandler = async (url, options) => {
      assert.equal(url, "https://api.brevo.com/v3/smtp/email");
      assert.equal(options.headers["api-key"], "test-api-key-123");
      const body = JSON.parse(options.body);
      assert.equal(body.sender.name, "PARIWESH");
      assert.equal(body.sender.email, "test@pariwesh.com");
      assert.deepEqual(body.to, [{ email: "recipient@example.com" }]);
      assert.equal(body.subject, "PARIWESH Migration");
      return new Response(JSON.stringify({ messageId: "brevo-msg-abc" }), {
        status: 200,
      });
    };

    const res = await sendMail({
      to: "recipient@example.com",
      subject: "PARIWESH Migration",
      html: "<p>Welcome to PARIWESH</p>",
      text: "Welcome to PARIWESH",
      type: "other",
    });

    assert.equal(res.ok, true);
    assert.equal(res.messageId, "brevo-msg-abc");
    assert.equal(res.provider, "brevo");

    assert.ok(lastLoggedPayload);
    assert.equal(lastLoggedPayload.status, "sent");
    assert.equal(lastLoggedPayload.provider, "brevo");
    assert.equal(lastLoggedPayload.statusCode, 200);
    assert.equal(lastLoggedPayload.retryCount, 0);
  });

  it("should redact HTML and text bodies for OTP type emails", async () => {
    mockFetchHandler = async () =>
      new Response(JSON.stringify({ messageId: "otp-id" }), { status: 200 });

    const res = await sendMail({
      to: "otp@example.com",
      subject: "Your OTP Verification",
      html: "<h3>123456</h3>",
      text: "123456",
      type: "otp",
    });

    assert.equal(res.ok, true);
    assert.equal(res.messageId, "otp-id");
    assert.equal(
      lastLoggedPayload.html,
      "OTP email content redacted for security",
    );
    assert.equal(
      lastLoggedPayload.text,
      "OTP email content redacted for security",
    );
  });

  it("should fail validation and skip send when recipient is empty or malformed", async () => {
    const emptyRes = await sendMail({
      to: "",
      subject: "Subject",
      html: "body",
    });
    assert.equal(emptyRes.ok, false);
    assert.equal(emptyRes.error, "No recipient email");
    assert.equal(lastLoggedPayload.status, "skipped");

    const malformedRes = await sendMail({
      to: "bademail.com",
      subject: "Subject",
      html: "body",
    });
    assert.equal(malformedRes.ok, false);
    assert.equal(malformedRes.error, "Malformed recipient email");
    assert.equal(lastLoggedPayload.status, "skipped");
  });

  it("should fail validation and skip send when configuration is missing", async () => {
    delete process.env.EMAIL_API_KEY;

    const res = await sendMail({
      to: "test@example.com",
      subject: "Subject",
      html: "body",
    });

    assert.equal(res.ok, false);
    assert.equal(res.error, "Email service is temporarily unavailable.");
    assert.equal(lastLoggedPayload.status, "skipped");
    assert.equal(
      lastLoggedPayload.error,
      "Mail provider configuration is invalid or missing.",
    );
  });

  it("should not retry on non-transient HTTP errors (like 400 Bad Request)", async () => {
    mockFetchHandler = async () => new Response("Bad Request", { status: 400 });

    const res = await sendMail({
      to: "test@example.com",
      subject: "Subject",
      html: "body",
    });

    assert.equal(res.ok, false);
    assert.equal(fetchCalls.length, 1); // Only 1 attempt
    assert.equal(lastLoggedPayload.status, "failed");
    assert.equal(lastLoggedPayload.statusCode, 400);
    assert.equal(lastLoggedPayload.retryCount, 0);
  });

  it("should retry on transient failures and succeed if a later attempt works", async () => {
    let callCount = 0;
    mockFetchHandler = async () => {
      callCount++;
      if (callCount < 3) {
        return new Response("Service Unavailable", { status: 503 });
      }
      return new Response(JSON.stringify({ messageId: "retry-worked-id" }), {
        status: 200,
      });
    };

    const res = await sendMail({
      to: "test@example.com",
      subject: "Subject",
      html: "body",
    });

    assert.equal(res.ok, true);
    assert.equal(res.messageId, "retry-worked-id");
    assert.equal(fetchCalls.length, 3); // 3 attempts made
    assert.equal(lastLoggedPayload.status, "sent");
    assert.equal(lastLoggedPayload.statusCode, 200);
    assert.equal(lastLoggedPayload.retryCount, 2);
  });

  it("should exhaust all retries and fail on persistent transient HTTP 500 errors", async () => {
    mockFetchHandler = async () =>
      new Response("Internal Server Error", { status: 500 });

    const res = await sendMail({
      to: "test@example.com",
      subject: "Subject",
      html: "body",
    });

    assert.equal(res.ok, false);
    assert.equal(fetchCalls.length, 3); // 3 attempts made
    assert.equal(lastLoggedPayload.status, "failed");
    assert.equal(lastLoggedPayload.statusCode, 500);
    assert.equal(lastLoggedPayload.retryCount, 2);
  });

  it("should retry and fail on network timeouts", async () => {
    mockFetchHandler = async () => {
      throw { name: "AbortError", message: "The operation was aborted." };
    };

    const res = await sendMail({
      to: "test@example.com",
      subject: "Subject",
      html: "body",
    });

    assert.equal(res.ok, false);
    assert.equal(fetchCalls.length, 3);
    assert.equal(lastLoggedPayload.status, "failed");
    assert.equal(lastLoggedPayload.statusCode, 408);
    assert.equal(lastLoggedPayload.error, "Brevo API request timed out");
  });

  it("should remain failure-isolated if writing logs to MongoDB throws an exception", async () => {
    stubLogFailure = true; // DB Error
    mockFetchHandler = async () =>
      new Response(JSON.stringify({ messageId: "db-fail-msg" }), {
        status: 200,
      });

    const res = await sendMail({
      to: "test@example.com",
      subject: "Subject",
      html: "body",
    });

    // Email delivery itself is successful even if persistence fails
    assert.equal(res.ok, true);
    assert.equal(res.messageId, "db-fail-msg");
  });
});
