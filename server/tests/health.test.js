import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

describe("health API", () => {
  let app;

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || "test_access_secret_pariwesh_ci";
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || "test_refresh_secret_pariwesh_ci";
    process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
    process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";
    ({ default: app } = await import("../app.js"));
  });

  it("GET /api/v1/health returns UP", async () => {
    const res = await request(app).get("/api/v1/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, "UP");
  });

  it("GET / returns running message", async () => {
    const res = await request(app).get("/");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it("unknown route returns 404", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    assert.equal(res.status, 404);
  });
});
