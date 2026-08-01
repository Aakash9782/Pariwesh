import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  signAccessToken,
  verifyAccessToken,
  getAccessExpiry,
  getRefreshExpiry,
} from "../utils/jwt.js";

describe("jwt utils", () => {
  before(() => {
    process.env.JWT_ACCESS_SECRET = "test_access_secret_pariwesh_ci";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_pariwesh_ci";
    process.env.JWT_ACCESS_EXPIRY = "15m";
    process.env.JWT_REFRESH_EXPIRY = "7d";
  });

  it("reads expiry from env", () => {
    assert.equal(getAccessExpiry(), "15m");
    assert.equal(getRefreshExpiry(), "7d");
  });

  it("signs and verifies access tokens", () => {
    const token = signAccessToken("user123");
    const decoded = verifyAccessToken(token);
    assert.equal(decoded.id, "user123");
  });

  it("rejects tokens signed with wrong secret", () => {
    const token = signAccessToken("user123");
    const prev = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = "different_secret";
    assert.throws(() => verifyAccessToken(token));
    process.env.JWT_ACCESS_SECRET = prev;
  });
});
