/**
 * Automatically appends q_auto,f_auto parameter to Cloudinary URLs
 * for optimized delivery format (WebP/AVIF) and quality compression.
 * Optionally resizes the image if a width is provided.
 * If the URL is not a Cloudinary image URL or is a base64 string, returns it unmodified.
 */
export const optimizeCloudinaryUrl = (url, width) => {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:")) return url;

  // Check if it's a Cloudinary asset URL
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    // If it already has transformation parameters like q_auto/f_auto/w_, handle it safely
    if (url.includes("/q_auto") || url.includes("/f_auto")) {
      if (width && !url.includes("w_")) {
        return url
          .replace("/q_auto", `/c_limit,w_${width},q_auto`)
          .replace("/f_auto", `/c_limit,w_${width},f_auto`);
      }
      return url;
    }

    const resizeParams = width ? `c_limit,w_${width},` : "";
    return url.replace("/upload/", `/upload/${resizeParams}q_auto,f_auto/`);
  }
  return url;
};
