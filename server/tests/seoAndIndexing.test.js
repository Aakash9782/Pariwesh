import test from "node:test";
import assert from "node:assert/strict";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Collection from "../models/Collection.js";
import { getSitemap, getGoogleMerchantFeed } from "../controllers/seoController.js";

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

test("Google Merchant Feed responds with valid Google RSS 2.0 XML and compliant attributes", async () => {
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

  Product.find = () => ({
    select: () => ({
      lean: () =>
        Promise.resolve([
          {
            sku: "PARI-KUR-001",
            name: "Pure Cotton Anarkali Kurta & Pants",
            slug: "cotton-anarkali-kurta-pants",
            description: "Handcrafted pure cotton kurta ensemble with gota patti.",
            mrp: 2999,
            price: 1999,
            stock: 15,
            brand: "Pariwesh",
            color: "Powder Blue",
            fabric: "Pure Cotton",
            category: "Suits",
            sizes: ["M", "L", "XL"],
            images: [
              "https://pariwesh.in/images/anarkali-main.jpg",
              "https://pariwesh.in/images/anarkali-back.jpg",
            ],
          },
        ]),
    }),
  });

  try {
    await getGoogleMerchantFeed(req, res, () => {});
  } finally {
    Product.find = originalProductFind;
  }

  assert.equal(statusCode, 200, "Merchant feed responds with 200 OK");
  assert.ok(headerMap["content-type"]?.includes("application/xml"), "Content-Type is XML");
  assert.ok(headerMap["cache-control"]?.includes("public"), "Cache-Control is public");
  assert.ok(sentBody.includes('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'), "Contains Google Merchant RSS declaration");
  assert.ok(sentBody.includes('<g:id>PARI-KUR-001</g:id>'), "Contains correct product SKU/ID");
  assert.ok(sentBody.includes('<g:title>Pure Cotton Anarkali Kurta &amp; Pants</g:title>'), "Contains escaped product title");
  assert.ok(sentBody.includes('<g:price>2999.00 INR</g:price>'), "Contains original MRP formatted with INR");
  assert.ok(sentBody.includes('<g:sale_price>1999.00 INR</g:sale_price>'), "Contains discounted sale price with INR");
  assert.ok(sentBody.includes('<g:availability>in_stock</g:availability>'), "Contains in_stock status");
  assert.ok(sentBody.includes('<g:brand>Pariwesh</g:brand>'), "Contains Pariwesh brand tag");
  assert.ok(sentBody.includes('<g:identifier_exists>no</g:identifier_exists>'), "Contains identifier_exists: no (mandatory for custom boutique D2C)");
  assert.ok(sentBody.includes('<g:google_product_category>1604</g:google_product_category>'), "Contains Google ethnic apparel category code");
  assert.ok(sentBody.includes('<g:gender>female</g:gender>'), "Contains female gender tag");
  assert.ok(sentBody.includes('<g:age_group>adult</g:age_group>'), "Contains adult age group tag");
  assert.ok(sentBody.includes('<g:color>Powder Blue</g:color>'), "Contains product color");
  assert.ok(sentBody.includes('<g:material>Pure Cotton</g:material>'), "Contains fabric/material tag");
  assert.ok(sentBody.includes('<g:size>M, L, XL</g:size>'), "Contains sizes");
  assert.ok(sentBody.includes('<g:image_link>https://pariwesh.in/images/anarkali-main.jpg</g:image_link>'), "Contains primary image link");
  assert.ok(sentBody.includes('<g:additional_image_link>https://pariwesh.in/images/anarkali-back.jpg</g:additional_image_link>'), "Contains secondary image link");
});
