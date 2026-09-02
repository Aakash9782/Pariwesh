import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  buildPasswordResetOtpEmail,
  buildPasswordChangedSuccessEmail,
} from "../utils/emailTemplates.js";
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendResetOtp,
} from "../controllers/userController.js";

// Helper to mock Express req, res
const createMockReqRes = ({ body = {}, params = {}, query = {} } = {}) => {
  const req = { body, params, query };
  let statusCode = 200;
  let responseData = null;
  let cookies = {};

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    cookie(name, value, opts) {
      cookies[name] = { value, opts };
      return this;
    },
    _getStatusCode: () => statusCode,
    _getResponseData: () => responseData,
    _getCookies: () => cookies,
  };

  return { req, res };
};

describe("Forgot Password Feature Tests", () => {
  before(() => {
    process.env.JWT_ACCESS_SECRET = "test_access_secret_pariwesh_ci";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_pariwesh_ci";
    process.env.JWT_ACCESS_EXPIRY = "15m";
    process.env.JWT_REFRESH_EXPIRY = "7d";
    process.env.NODE_ENV = "test";
  });

  it("builds password reset OTP email with proper content", () => {
    const email = buildPasswordResetOtpEmail({
      name: "Rohit",
      otp: "123456",
      expiresMinutes: 10,
    });
    assert.ok(email.subject.includes("Password Reset Verification Code"));
    assert.ok(email.html.includes("123456"));
    assert.ok(email.html.includes("Rohit"));
  });

  it("builds password changed success email with security alert", () => {
    const email = buildPasswordChangedSuccessEmail({ name: "Rohit" });
    assert.ok(email.subject.includes("Security Alert: Password Changed"));
    assert.ok(email.html.includes("Rohit"));
    assert.ok(email.html.includes("password was changed successfully"));
  });

  describe("Controller logic with mocked User model", () => {
    const originalFindOne = User.findOne;
    let mockUser = null;

    before(() => {
      User.findOne = (query) => {
        if (query.email === "test@pariwesh.in") {
          return {
            select(fields) {
              return Promise.resolve(mockUser);
            },
            then(resolve) {
              return resolve(mockUser);
            },
          };
        }
        return {
          select() {
            return Promise.resolve(null);
          },
          then(resolve) {
            return resolve(null);
          },
        };
      };
    });

    after(() => {
      User.findOne = originalFindOne;
    });

    it("rejects forgot-password when email is invalid or missing", async () => {
      const { req, res } = createMockReqRes({ body: { email: "invalid-email" } });
      await forgotPassword(req, res);
      assert.equal(res._getStatusCode(), 400);
      assert.equal(res._getResponseData()?.success, false);
    });

    it("returns 404 when user is not found", async () => {
      const { req, res } = createMockReqRes({ body: { email: "nonexistent@pariwesh.in" } });
      await forgotPassword(req, res);
      assert.equal(res._getStatusCode(), 404);
      assert.equal(res._getResponseData()?.success, false);
    });

    it("sends reset OTP and sets resetPasswordOtp in user", async () => {
      let saved = false;
      mockUser = {
        _id: "user-id-123",
        name: "Test User",
        email: "test@pariwesh.in",
        status: "active",
        resetPasswordOtp: null,
        save: async function () {
          saved = true;
          return this;
        },
      };

      const { req, res } = createMockReqRes({ body: { email: "test@pariwesh.in" } });
      await forgotPassword(req, res);

      assert.equal(res._getStatusCode(), 200);
      assert.equal(res._getResponseData()?.success, true);
      assert.ok(saved);
      assert.ok(mockUser.resetPasswordOtp?.hash);
      assert.ok(mockUser.resetPasswordOtp?.expiresAt);
      assert.equal(mockUser.resetPasswordOtp.attempts, 0);
    });

    it("enforces cooldown when OTP was requested recently", async () => {
      mockUser = {
        _id: "user-id-123",
        name: "Test User",
        email: "test@pariwesh.in",
        status: "active",
        resetPasswordOtp: {
          hash: "abc",
          expiresAt: new Date(Date.now() + 600000),
          lastSentAt: new Date(), // Sent right now
        },
        save: async () => {},
      };

      const { req, res } = createMockReqRes({ body: { email: "test@pariwesh.in" } });
      await forgotPassword(req, res);
      assert.equal(res._getStatusCode(), 429);
      assert.equal(res._getResponseData()?.success, false);
    });

    it("rejects verifyResetOtp when OTP is incorrect and increments attempt count", async () => {
      const correctOtp = "654321";
      const hashedOtp = crypto.createHash("sha256").update(correctOtp).digest("hex");

      mockUser = {
        _id: "user-id-123",
        name: "Test User",
        email: "test@pariwesh.in",
        status: "active",
        resetPasswordOtp: {
          hash: hashedOtp,
          expiresAt: new Date(Date.now() + 600000),
          attempts: 0,
        },
        save: async function () {
          return this;
        },
      };

      const { req, res } = createMockReqRes({
        body: { email: "test@pariwesh.in", otp: "111111" },
      });
      await verifyResetOtp(req, res);

      assert.equal(res._getStatusCode(), 400);
      assert.equal(res._getResponseData()?.success, false);
      assert.equal(mockUser.resetPasswordOtp.attempts, 1);
    });

    it("verifies correct OTP, clears OTP hash, and generates resetToken", async () => {
      const correctOtp = "654321";
      const hashedOtp = crypto.createHash("sha256").update(correctOtp).digest("hex");

      mockUser = {
        _id: "user-id-123",
        name: "Test User",
        email: "test@pariwesh.in",
        status: "active",
        resetPasswordOtp: {
          hash: hashedOtp,
          expiresAt: new Date(Date.now() + 600000),
          attempts: 1,
        },
        save: async function () {
          return this;
        },
      };

      const { req, res } = createMockReqRes({
        body: { email: "test@pariwesh.in", otp: correctOtp },
      });
      await verifyResetOtp(req, res);

      assert.equal(res._getStatusCode(), 200);
      const data = res._getResponseData()?.data;
      assert.ok(data?.resetToken);
      assert.equal(mockUser.resetPasswordOtp.hash, null);
      assert.ok(mockUser.resetPasswordOtp.resetTokenHash);
      assert.ok(mockUser.resetPasswordOtp.resetTokenExpiresAt);
    });

    it("resets password with valid resetToken and returns auth token", async () => {
      const rawToken = "my-secure-32-byte-token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockUser = {
        _id: "user-id-123",
        name: "Test User",
        email: "test@pariwesh.in",
        role: "customer",
        isVerified: false,
        addresses: [],
        password: "oldHashedPassword",
        resetPasswordOtp: {
          hash: null,
          resetTokenHash: tokenHash,
          resetTokenExpiresAt: new Date(Date.now() + 600000),
        },
        save: async function () {
          return this;
        },
      };

      const { req, res } = createMockReqRes({
        body: {
          email: "test@pariwesh.in",
          resetToken: rawToken,
          newPassword: "newSuperSecretPassword123",
        },
      });
      await resetPassword(req, res);

      assert.equal(res._getStatusCode(), 200);
      assert.equal(res._getResponseData()?.success, true);
      assert.ok(res._getResponseData()?.data?.token);
      assert.equal(mockUser.isVerified, true);
      assert.equal(mockUser.resetPasswordOtp.resetTokenHash, null);

      // Verify bcrypt password was updated
      const match = await bcrypt.compare(
        "newSuperSecretPassword123",
        mockUser.password,
      );
      assert.equal(match, true);
    });
  });
});
