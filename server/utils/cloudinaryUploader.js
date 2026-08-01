import cloudinary from "../config/cloudinary.js";

/**
 * Helper to race an async operation against a timeout.
 */
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
};

/**
 * @desc   Uploads a base64 encoded image string to Cloudinary
 * @param  {String} base64Str - The image base64 data string (e.g. data:image/png;base64,...)
 * @param  {String} folder - Target folder prefix in Cloudinary
 * @returns {Promise<String>} The uploaded image secure URL string
 */
export const uploadBase64Image = async (
  base64Str,
  folder = "pariwesh/products",
) => {
  try {
    if (!base64Str) return "";

    // If it's already a hosted URL, don't re-upload
    if (base64Str.startsWith("http://") || base64Str.startsWith("https://")) {
      return base64Str;
    }

    // Check for missing or dummy credentials
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (
      !cloudName ||
      !apiKey ||
      !apiSecret ||
      apiKey.includes("dummy") ||
      apiSecret.includes("dummy")
    ) {
      console.warn(
        "⚠️ Cloudinary credentials not configured or dummy. Storing image as base64 in database.",
      );
      return base64Str;
    }

    const uploadResponse = await withTimeout(
      cloudinary.uploader.upload(base64Str, {
        folder: folder,
        resource_type: "image",
      }),
      5000, // 5 seconds timeout
    );

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary Image upload error/timeout:", error);
    console.warn("⚠️ Falling back to database storage of base64 image data.");
    return base64Str;
  }
};

/**
 * @desc   Uploads a base64 encoded video string to Cloudinary
 * @param  {String} base64Str - The video base64 data string (e.g. data:video/mp4;base64,...)
 * @param  {String} folder - Target folder prefix in Cloudinary
 * @returns {Promise<String>} The uploaded video secure URL string
 */
export const uploadBase64Video = async (
  base64Str,
  folder = "pariwesh/videos",
) => {
  try {
    if (!base64Str) return "";

    // If it's already a hosted URL, don't re-upload
    if (base64Str.startsWith("http://") || base64Str.startsWith("https://")) {
      return base64Str;
    }

    // Check for missing or dummy credentials
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (
      !cloudName ||
      !apiKey ||
      !apiSecret ||
      apiKey.includes("dummy") ||
      apiSecret.includes("dummy")
    ) {
      console.warn(
        "⚠️ Cloudinary credentials not configured or dummy. Storing video as base64 in database.",
      );
      return base64Str;
    }

    const uploadResponse = await withTimeout(
      cloudinary.uploader.upload(base64Str, {
        folder: folder,
        resource_type: "video",
      }),
      8000, // 8 seconds timeout
    );

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary Video upload error/timeout:", error);
    console.warn("⚠️ Falling back to database storage of base64 video data.");
    return base64Str;
  }
};
