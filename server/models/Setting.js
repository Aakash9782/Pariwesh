import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Setting", SettingSchema);
