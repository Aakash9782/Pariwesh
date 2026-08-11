/**
 * Automatically appends q_auto,f_auto parameter to Cloudinary URLs
 * for optimized delivery format (WebP/AVIF) and quality compression.
 * If the URL is not a Cloudinary image URL, returns it unmodified.
 */
export const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== "string") return url;

  // Check if it's a Cloudinary asset URL
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    // Avoid double-optimization if it already contains transformation parameters
    if (!url.includes("/q_auto")) {
      return url.replace("/upload/", "/upload/q_auto,f_auto/");
    }
  }
  return url;
};
