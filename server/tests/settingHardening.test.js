import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import User from "../models/User.js";
import Setting from "../models/Setting.js";
import ActivityLog from "../models/ActivityLog.js";
import { signAccessToken } from "../utils/jwt.js";

describe("Setting Controller Hardening and base64 Prevention", () => {
  let app;
  let adminToken;
  const originalFindById = User.findById;
  const originalSettingFindOne = Setting.findOne;
  const originalSettingCreate = Setting.create;
  const originalActivityLogCreate = ActivityLog.create;

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET = "test_access_secret_pariwesh_ci";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_pariwesh_ci";
    process.env.JWT_ACCESS_EXPIRY = "15m";
    process.env.JWT_REFRESH_EXPIRY = "7d";

    // Stub User.findById
    User.findById = async (id) => {
      if (id === "admin-123") {
        return { _id: "admin-123", role: "admin", status: "active" };
      }
      return null;
    };

    // Stub Setting model database actions
    Setting.findOne = async (filter) => {
      return {
        key: filter.key,
        value: "old-logo.png",
        save: async function () {
          return this;
        },
      };
    };

    Setting.create = async (payload) => {
      return {
        ...payload,
        save: async function () {
          return this;
        },
      };
    };

    // Stub ActivityLog
    ActivityLog.create = async (payload) => {
      return payload;
    };

    // Sign admin token
    adminToken = signAccessToken("admin-123");

    ({ default: app } = await import("../app.js"));
  });

  after(async () => {
    User.findById = originalFindById;
    Setting.findOne = originalSettingFindOne;
    Setting.create = originalSettingCreate;
    ActivityLog.create = originalActivityLogCreate;

    await mongoose.disconnect();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  });

  it("POST /api/v1/settings allows saving normal string settings with admin auth", async () => {
    const res = await request(app)
      .post("/api/v1/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "brandName", value: "Pariwesh Test V3" });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.value, "Pariwesh Test V3");
  });

  it("POST /api/v1/settings rejects Base64 string value with 400 Bad Request to prevent DB bloat", async () => {
    const prevKey = process.env.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_KEY = "dummy_key";

    const res = await request(app)
      .post("/api/v1/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        key: "brandLogoUrl",
        value:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      });

    process.env.CLOUDINARY_API_KEY = prevKey;

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes("is not allowed"));
  });
});
