import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  structuredData,
  noindex = false,
  robots,
}) => {
  // Brand default settings
  const defaultTitle = "PARIWESH | Premium Traditional Ethnic Wear & Kurtas";
  const defaultDesc =
    "Discover premium traditional ethnic suit sets, handcrafted kurtis, and designer wear for women at PARIWESH. Elevated designs crafted with luxury fabrics.";
  const defaultKeywords =
    "Pariwesh, Ethnic Wear, Suit Sets, Kurtis, Traditional Indian Wear, Luxury Crafts, Designer Kurtas";

  // Derive page metadata
  const pageTitle = title ? `${title} | PARIWESH` : defaultTitle;
  const pageDesc = description || defaultDesc;
  const pageKeywords = keywords || defaultKeywords;

  // Dynamically resolve canonical URL (using window.location to strictly avoid hardcoding domain names)
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://pariwesh.com";
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const canonical = canonicalUrl
    ? `${origin}${canonicalUrl}`
    : `${origin}${path}`;

  // Fallback default OG image
  const defaultOgImage = `${origin}/og-image.jpg`;
  const ogImg = ogImage || defaultOgImage;

  // Handle indexing/robots meta
  let robotsContent = "index, follow";
  if (noindex) {
    robotsContent = "noindex, nofollow";
  } else if (robots) {
    robotsContent = robots;
  }

  // Format structured data array or object cleanly into JSON-LD script blocks
  const renderStructuredData = () => {
    if (!structuredData) return null;
    const schemas = Array.isArray(structuredData)
      ? structuredData
      : [structuredData];
    return schemas.map((schema, index) => {
      if (!schema) return null;
      return (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      );
    });
  };

  return (
    <Helmet>
      {/* 1. Primary Page Metadata */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta name="keywords" content={pageKeywords} />
      <link rel="canonical" href={canonical} />

      {/* 2. Crawlability Rules */}
      <meta name="robots" content={robotsContent} />

      {/* 3. Open Graph Metadata */}
      <meta property="og:site_name" content="PARIWESH" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImg} />

      {/* 4. Twitter Card Metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={ogImg} />

      {/* 5. JSON-LD Schemas */}
      {renderStructuredData()}
    </Helmet>
  );
};

export default SEO;
