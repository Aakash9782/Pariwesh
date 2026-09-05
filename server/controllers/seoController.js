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
