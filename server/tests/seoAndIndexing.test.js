import test from "node:test";
import assert from "node:assert/strict";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Collection from "../models/Collection.js";
import { getSitemap } from "../controllers/seoController.js";

test("Database Models define correct background indexes without errors", () => {
  const productIndexes = Product.schema.indexes();
  assert.ok(Array.isArray(productIndexes), "Product schema has indexes array");
  
  // Verify background option is set on custom indexes
  const statusCreatedIndex = productIndexes.find(
    ([fields]) => fields.status === 1 && fields.createdAt === -1
  );
  assert.ok(statusCreatedIndex, "Product status + createdAt index exists");
  assert.equal(statusCreatedIndex[1].background, true, "Product index has background: true");

  const categoryIndex = productIndexes.find(
    ([fields]) => fields.category === 1 && fields.status === 1
  );
  assert.ok(categoryIndex, "Product category + status index exists");
  assert.equal(categoryIndex[1].background, true, "Product category index has background: true");

  const orderIndexes = Order.schema.indexes();
  const customerUserIdIndex = orderIndexes.find(
    ([fields]) => fields["customer.userId"] === 1 && fields.createdAt === -1
  );
  assert.ok(customerUserIdIndex, "Order customer.userId + createdAt index exists");
  assert.equal(customerUserIdIndex[1].background, true, "Order index has background: true");

  const couponIndexes = Coupon.schema.indexes();
  const couponStatusIndex = couponIndexes.find(
    ([fields]) => fields.status === 1 && fields.isSpecialOffer === 1
  );
  assert.ok(couponStatusIndex, "Coupon status + isSpecialOffer index exists");
  assert.equal(couponStatusIndex[1].background, true, "Coupon index has background: true");
});

test("SEO getSitemap responds with valid XML structure and caching headers", async () => {
  let headerMap = {};
  let statusCode = null;
  let sentBody = "";

  const req = {
    query: { refresh: "true" },
  };

  const res = {
    header: (key, val) => {
      headerMap[key.toLowerCase()] = val;
      return res;
    },
    status: (code) => {
      statusCode = code;
      return res;
    },
    send: (data) => {
      sentBody = data;
      return res;
    },
    json: (data) => {
      sentBody = JSON.stringify(data);
      return res;
    },
  };

  const originalProductFind = Product.find;
  const originalCollectionFind = Collection.find;

  Product.find = () => ({
    select: () =>
      Promise.resolve([
        {
          name: "Chanderi Silk Suit Set",
          slug: "chanderi-silk-suit-set",
          images: ["https://pariwesh.in/images/chanderi.jpg"],
          updatedAt: new Date("2026-09-01"),
        },
      ]),
  });

  Collection.find = () => ({
    select: () =>
      Promise.resolve([
        {
          name: "Festive Suits",
          slug: "festive-suits",
          updatedAt: new Date("2026-09-01"),
        },
      ]),
  });

  try {
    await getSitemap(req, res, () => {});
  } finally {
    Product.find = originalProductFind;
    Collection.find = originalCollectionFind;
  }

  assert.equal(statusCode, 200, "Sitemap responds with 200 OK");
  assert.equal(headerMap["content-type"], "application/xml", "Content-Type is application/xml");
  assert.ok(headerMap["cache-control"]?.includes("public"), "Cache-Control is set for browser/crawler caching");
  assert.ok(sentBody.includes('<?xml version="1.0" encoding="UTF-8"?>'), "Contains XML declaration");
  assert.ok(sentBody.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), "Contains standard sitemap xmlns");
  assert.ok(sentBody.includes('https://pariwesh.in/'), "Contains base homepage URL");
  assert.ok(sentBody.includes('https://pariwesh.in/shop'), "Contains shop URL");
  assert.ok(sentBody.includes('https://pariwesh.in/collections'), "Contains collections URL");
  assert.ok(sentBody.includes('https://pariwesh.in/product/chanderi-silk-suit-set'), "Contains dynamic product URL");
  assert.ok(sentBody.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), "Contains Google Image schema namespace");
  assert.ok(sentBody.includes('<image:loc>https://pariwesh.in/images/chanderi.jpg</image:loc>'), "Contains product image XML tag");
  assert.ok(sentBody.includes('https://pariwesh.in/collections/festive-suits'), "Contains collection URL");
});
