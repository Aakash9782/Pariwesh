import Product from "../models/Product.js";
import Collection from "../models/Collection.js";

const escapeXml = (unsafe) => {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
};

// 1-hour in-memory cache to eliminate repeated DB queries from web crawlers
let cachedXml = null;
let lastCacheTime = 0;
const CACHE_MS = 60 * 60 * 1000;

// @desc    Generate dynamic XML sitemap with Google Image support
// @route   GET /api/v1/seo/sitemap and GET /sitemap.xml
// @access  Public
export const getSitemap = async (req, res, next) => {
  try {
    const isForceRefresh = req.query?.refresh === "true";
    const now = Date.now();

    if (!isForceRefresh && cachedXml && now - lastCacheTime < CACHE_MS) {
      res.header("Content-Type", "application/xml");
      res.header("Cache-Control", "public, max-age=3600");
      return res.status(200).send(cachedXml);
    }

    const rawDomain = process.env.FRONTEND_URL || "https://pariwesh.in";
    const domain = rawDomain.trim().replace(/\/$/, "");

    // 1. Core Static URLs
    const staticUrls = [
      { loc: `${domain}/`, changefreq: "daily", priority: "1.0" },
      { loc: `${domain}/shop`, changefreq: "daily", priority: "0.9" },
      { loc: `${domain}/collections`, changefreq: "weekly", priority: "0.8" },
      { loc: `${domain}/about`, changefreq: "monthly", priority: "0.5" },
      { loc: `${domain}/contact`, changefreq: "monthly", priority: "0.5" },
      { loc: `${domain}/privacy-policy`, changefreq: "monthly", priority: "0.3" },
      { loc: `${domain}/terms`, changefreq: "monthly", priority: "0.3" },
      { loc: `${domain}/shipping`, changefreq: "monthly", priority: "0.3" },
      { loc: `${domain}/returns`, changefreq: "monthly", priority: "0.3" },
      { loc: `${domain}/cancellation-policy`, changefreq: "monthly", priority: "0.3" },
    ];

    // 2. Fetch Active Products (with resilient fallback for zero downtime)
    let productUrls = [];
    try {
      const products = await Product.find({
        status: { $in: ["active", "Active"] },
      }).select("name slug images updatedAt");

      productUrls = (products || []).map((prod) => ({
        loc: `${domain}/product/${prod.slug}`,
        lastmod: prod.updatedAt
          ? new Date(prod.updatedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        changefreq: "weekly",
        priority: "0.8",
        image: prod.images && prod.images.length > 0 ? prod.images[0] : null,
        title: prod.name || "",
      }));
    } catch (dbErr) {
      console.warn("[Sitemap] Product query fallback:", dbErr.message);
    }

    // 3. Fetch Collections
    let collectionUrls = [];
    try {
      const collections = await Collection.find({}).select("name slug updatedAt");
      collectionUrls = collections.map((col) => ({
        loc: `${domain}/collections/${col.slug}`,
        lastmod: col.updatedAt
          ? new Date(col.updatedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        changefreq: "weekly",
        priority: "0.7",
      }));
    } catch {
      // Collections optional fallback
    }

    const allUrls = [...staticUrls, ...productUrls, ...collectionUrls];

    // Build XML with standard Google Sitemap and Image schemas
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    allUrls.forEach((url) => {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod || new Date().toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      if (url.image) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(url.image)}</image:loc>\n`;
        if (url.title) {
          xml += `      <image:title>${escapeXml(url.title)}</image:title>\n`;
        }
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    cachedXml = xml;
    lastCacheTime = Date.now();

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    return res.status(200).send(xml);
  } catch (error) {
    res.header("Content-Type", "application/json");
    return res.status(500).json({ success: false, message: error.message });
  }
};

const stripHtml = (html) => {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// 2-hour in-memory cache for Google Merchant Feed to eliminate crawler DB pressure
let cachedMerchantXml = null;
let lastMerchantCacheTime = 0;
const MERCHANT_CACHE_MS = 2 * 60 * 60 * 1000;

// @desc    Generate dynamic Google Merchant Center RSS 2.0 XML product feed
// @route   GET /api/v1/seo/google-merchant-feed.xml and GET /google-merchant-feed.xml
// @access  Public
export const getGoogleMerchantFeed = async (req, res, next) => {
  try {
    const isForceRefresh = req.query?.refresh === "true";
    const now = Date.now();

    if (!isForceRefresh && cachedMerchantXml && now - lastMerchantCacheTime < MERCHANT_CACHE_MS) {
      res.header("Content-Type", "application/xml; charset=utf-8");
      res.header("Cache-Control", "public, max-age=7200");
      return res.status(200).send(cachedMerchantXml);
    }

    const rawDomain = process.env.FRONTEND_URL || "https://pariwesh.in";
    const domain = rawDomain.trim().replace(/\/$/, "");

    let products = [];
    try {
      products = await Product.find({
        status: { $in: ["active", "Active"] },
      })
        .select(
          "sku name slug description mrp price stock sizes sizesStock images brand color fabric material category seoTitle seoDescription"
        )
        .lean();
    } catch (dbErr) {
      console.warn("[GoogleMerchantFeed] Product query fallback:", dbErr.message);
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>Pariwesh - Luxury Ethnic Wear Store</title>\n`;
    xml += `    <link>${escapeXml(domain)}</link>\n`;
    xml += `    <description>Official Google Merchant Product Feed for Pariwesh Luxury Ethnic Wear, Suits, and Kurtas.</description>\n`;

    (products || []).forEach((prod) => {
      try {
        // Validation: Google Merchant requires an ID, Title, Description, Link, Price, and Image Link
        const id = prod.sku ? String(prod.sku).trim() : String(prod._id);
        const title = prod.name ? String(prod.name).trim() : (prod.seoTitle || "Pariwesh Ethnic Ensemble");
        const rawDesc = prod.description || prod.seoDescription || "Premium ethnic wear ensemble designed for high quality luxury styles by Pariwesh.";
        const cleanDesc = stripHtml(rawDesc).slice(0, 5000);
        const productUrl = `${domain}/product/${prod.slug || id}`;

        const validImages = Array.isArray(prod.images)
          ? prod.images.filter((img) => typeof img === "string" && img.startsWith("http"))
          : [];

        // Google Merchant requires at least 1 public valid image
        if (validImages.length === 0) {
          return;
        }

        const mainImage = validImages[0];
        const additionalImages = validImages.slice(1, 11);

        const sellingPrice = Number(prod.price) || 0;
        const mrp = Number(prod.mrp) || sellingPrice;
        const inStock = (Number(prod.stock) || 0) > 0;
        const brand = prod.brand ? String(prod.brand).trim() : "Pariwesh";
        const category = prod.category ? String(prod.category).trim() : "Suits";

        xml += `    <item>\n`;
        xml += `      <g:id>${escapeXml(id)}</g:id>\n`;
        xml += `      <g:title>${escapeXml(title)}</g:title>\n`;
        xml += `      <g:description>${escapeXml(cleanDesc)}</g:description>\n`;
        xml += `      <g:link>${escapeXml(productUrl)}</g:link>\n`;
        xml += `      <g:image_link>${escapeXml(mainImage)}</g:image_link>\n`;

        additionalImages.forEach((addImg) => {
          xml += `      <g:additional_image_link>${escapeXml(addImg)}</g:additional_image_link>\n`;
        });

        // Price formatting for Google Merchant: X.XX INR
        if (mrp > sellingPrice) {
          xml += `      <g:price>${mrp.toFixed(2)} INR</g:price>\n`;
          xml += `      <g:sale_price>${sellingPrice.toFixed(2)} INR</g:sale_price>\n`;
        } else {
          xml += `      <g:price>${sellingPrice.toFixed(2)} INR</g:price>\n`;
        }

        xml += `      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>\n`;
        xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`;
        xml += `      <g:condition>new</g:condition>\n`;
        // Essential tag for D2C stores to exempt from mandatory GTIN/UPC/barcode
        xml += `      <g:identifier_exists>no</g:identifier_exists>\n`;
        // Google Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing
        xml += `      <g:google_product_category>1604</g:google_product_category>\n`;
        xml += `      <g:product_type>${escapeXml(category)}</g:product_type>\n`;
        xml += `      <g:gender>female</g:gender>\n`;
        xml += `      <g:age_group>adult</g:age_group>\n`;

        if (prod.color) {
          xml += `      <g:color>${escapeXml(prod.color)}</g:color>\n`;
        }

        const fabricOrMaterial = prod.fabric || prod.material;
        if (fabricOrMaterial) {
          xml += `      <g:material>${escapeXml(fabricOrMaterial)}</g:material>\n`;
        }

        if (Array.isArray(prod.sizes) && prod.sizes.length > 0) {
          xml += `      <g:size>${escapeXml(prod.sizes.join(", "))}</g:size>\n`;
        }

        xml += `    </item>\n`;
      } catch (itemErr) {
        console.warn(`[GoogleMerchantFeed] Skipping product due to formatting error:`, itemErr.message);
      }
    });

    xml += `  </channel>\n`;
    xml += `</rss>\n`;

    cachedMerchantXml = xml;
    lastMerchantCacheTime = Date.now();

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=7200");
    return res.status(200).send(xml);
  } catch (error) {
    console.error("[GoogleMerchantFeed] Error generating feed:", error);
    res.header("Content-Type", "application/json");
    return res.status(500).json({ success: false, message: error.message });
  }
};
