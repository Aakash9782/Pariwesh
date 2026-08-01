import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { validateRequiredEnv } from "../utils/validateEnv.js";

describe("validateRequiredEnv", () => {
  const keys = [
    "MONGO_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_ACCESS_EXPIRY",
    "JWT_REFRESH_EXPIRY",
  ];
  let snapshot = {};

  before(() => {
    keys.forEach((k) => {
      snapshot[k] = process.env[k];
    });
  });

  it("passes when all required vars are set", () => {
    keys.forEach((k) => {
      process.env[k] = process.env[k] || `test_${k}`;
    });
    assert.doesNotThrow(() => validateRequiredEnv());
  });
});
