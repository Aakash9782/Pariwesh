import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  toE164,
  isValidEmail,
  isAdminEmail,
  getAdminEmails,
} from "../utils/phone.js";

describe("phone utils", () => {
  it("normalizes Indian numbers to 10 digits", () => {
    assert.equal(normalizePhone("+91 98765-43210"), "9876543210");
    assert.equal(normalizePhone("919876543210"), "9876543210");
    assert.equal(normalizePhone("9876543210"), "9876543210");
  });

  it("builds E.164", () => {
    process.env.TWILIO_DEFAULT_COUNTRY_CODE = "91";
    assert.equal(toE164("9876543210"), "+919876543210");
  });

  it("validates emails", () => {
    assert.equal(isValidEmail("a@b.com"), true);
    assert.equal(isValidEmail("nope"), false);
  });

  it("checks admin emails from env", () => {
    process.env.ADMIN_EMAILS = "Admin@Pariwesh.com, other@x.com";
    assert.deepEqual(getAdminEmails(), ["admin@pariwesh.com", "other@x.com"]);
    assert.equal(isAdminEmail("admin@pariwesh.com"), true);
    assert.equal(isAdminEmail("customer@x.com"), false);
  });
});
