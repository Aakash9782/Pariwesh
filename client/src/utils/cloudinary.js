/**
 * Automatically appends modern format (f_auto) and compression (q_auto:good)
 * parameters to Cloudinary URLs for optimal delivery (WebP/AVIF).
 * Safely strips previous transformation segments before applying new dimension limits.
 * If the URL is not a Cloudinary image URL or is a data/blob string, returns it unmodified.
 */
export const optimizeCloudinaryUrl = (url, width, quality = "good") => {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  // Check if it's a Cloudinary asset URL
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const uploadIndex = url.indexOf("/upload/");
    const prefix = url.substring(0, uploadIndex + 8); // includes '/upload/'
    const rest = url.substring(uploadIndex + 8);

    const segments = rest.split("/");
    let pathStartIndex = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      // Check if it's a version tag (e.g. v1786455681)
      if (/^v\d+$/.test(seg)) {
        pathStartIndex = i;
        break;
      }
      // If it contains known transformation keys (c_, w_, h_, q_, f_, etc.), skip transformation segment
      if (
        seg.includes("c_") ||
        seg.includes("w_") ||
        seg.includes("q_") ||
        seg.includes("f_") ||
        seg.includes("h_") ||
        seg.includes("g_")
      ) {
        continue;
      }
      pathStartIndex = i;
      break;
    }

    const cleanPath = segments.slice(pathStartIndex).join("/");
    const transformParts = ["f_auto"];

    if (quality) {
      transformParts.push(`q_auto:${quality}`);
    } else {
      transformParts.push("q_auto");
    }

    if (width) {
      transformParts.push(`c_limit,w_${Math.round(width)}`);
    }

    return `${prefix}${transformParts.join(",")}/${cleanPath}`;
  }

  return url;
};
