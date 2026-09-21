import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Review from "../models/Review.js";

describe("Review Model & Controller Unit Logic", () => {
  it("should validate that ReviewSchema requires product, name, rating, comment", () => {
    const emptyReview = new Review({});
    const err = emptyReview.validateSync();

    assert.ok(err.errors["product"], "product is required");
    assert.ok(err.errors["name"], "name is required");
    assert.ok(err.errors["rating"], "rating is required");
    assert.ok(err.errors["comment"], "comment is required");
  });

  it("should enforce rating between 1 and 5", () => {
    const invalidLow = new Review({
      product: new mongoose.Types.ObjectId(),
      name: "Test",
      rating: 0,
      comment: "Good dress",
    });
    const errLow = invalidLow.validateSync();
    assert.ok(errLow.errors["rating"]);

    const invalidHigh = new Review({
      product: new mongoose.Types.ObjectId(),
      name: "Test",
      rating: 6,
      comment: "Good dress",
    });
    const errHigh = invalidHigh.validateSync();
    assert.ok(errHigh.errors["rating"]);

    const valid = new Review({
      product: new mongoose.Types.ObjectId(),
      name: "Test",
      rating: 5,
      comment: "Good dress",
    });
    const errValid = valid.validateSync();
    assert.equal(errValid, undefined);
  });

  it("should default verifiedPurchase to true and status to approved", () => {
    const review = new Review({
      product: new mongoose.Types.ObjectId(),
      name: "Ritu S., Lucknow",
      rating: 5,
      comment: "Farshi salwar fitting was top notch",
    });

    assert.equal(review.verifiedPurchase, true);
    assert.equal(review.status, "approved");
    assert.equal(review.helpfulCount, 0);
  });
});
