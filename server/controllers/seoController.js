import Product from "../models/Product.js";
import Collection from "../models/Collection.js";

// @desc    Generate dynamic XML sitemap
// @route   GET /api/v1/seo/sitemap
// @access  Public
export const getSitemap = async (req, res, next) => {
  try {
    const rawDomain = process.env.FRONTEND_URL || "https://pariwesh.com";
    const domain = rawDomain.trim().replace(/\/$/, "");

    // 1. Static URLs
    const staticUrls = [
      { loc: `${domain}/`, changefreq: "daily", priority: "1.0" },
      { loc: `${domain}/shop`, changefreq: "weekly", priority: "0.8" },
      { loc: `${domain}/collections`, changefreq: "weekly", priority: "0.8" },
      { loc: `${domain}/about-us`, changefreq: "monthly", priority: "0.5" },
      { loc: `${domain}/contact-us`, changefreq: "monthly", priority: "0.5" },
      {
        loc: `${domain}/privacy-policy`,
        changefreq: "monthly",
        priority: "0.3",
      },
      { loc: `${domain}/terms`, changefreq: "monthly", priority: "0.3" },
      {
        loc: `${domain}/shipping-policy`,
        changefreq: "monthly",
        priority: "0.3",
      },
      {
        loc: `${domain}/returns-policy`,
        changefreq: "monthly",
        priority: "0.3",
      },
      {
        loc: `${domain}/cancellation-policy`,
        changefreq: "monthly",
        priority: "0.3",
      },
    ];

    // 2. Fetch products
    const products = await Product.find({ status: "active" }).select(
      "slug updatedAt",
    );
    const productUrls = products.map((prod) => ({
      loc: `${domain}/product/${prod.slug}`,
      lastmod: prod.updatedAt
        ? new Date(prod.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      changefreq: "weekly",
      priority: "0.7",
    }));

    // 3. Fetch collections
    const collections = await Collection.find({}).select("slug updatedAt");
    const collectionUrls = collections.map((col) => ({
      loc: `${domain}/collections/${col.slug}`,
      lastmod: col.updatedAt
        ? new Date(col.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      changefreq: "weekly",
      priority: "0.6",
    }));

    const allUrls = [...staticUrls, ...productUrls, ...collectionUrls];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    allUrls.forEach((url) => {
      xml += `  <url>\n`;
      xml += `    <loc>${url.loc}</loc>\n`;
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      } else {
        xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
      }
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    res.header("Content-Type", "application/xml");
    return res.status(200).send(xml);
  } catch (error) {
    res.header("Content-Type", "application/json");
    return res.status(500).json({ success: false, message: error.message });
  }
};
