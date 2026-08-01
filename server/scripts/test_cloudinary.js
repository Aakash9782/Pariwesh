import cloudinary from "./config/cloudinary.js";
import { uploadBase64Image } from "./utils/cloudinaryUploader.js";

const test = async () => {
  try {
    console.log("Testing Cloudinary upload...");
    const base64Str =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const result = await uploadBase64Image(base64Str, "pariwesh/test");
    console.log("Upload Success! URL:", result);
    process.exit(0);
  } catch (err) {
    console.error("Upload Failed:", err);
    process.exit(1);
  }
};

test();

