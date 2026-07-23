import cloudinary from "../config/cloudinary.js";

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

    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: folder,
      resource_type: "image",
    });

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary Image upload error:", error);
    throw new Error("Failed to upload image asset to Cloudinary");
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

    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: folder,
      resource_type: "video",
    });

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary Video upload error:", error);
    throw new Error("Failed to upload video asset to Cloudinary");
  }
};
