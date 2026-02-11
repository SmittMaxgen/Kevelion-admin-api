import mongoose from "mongoose";

const { Schema, model } = mongoose;

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, unique: true }, // changed to String (to preserve leading 0s)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    image: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive", "OnLeave"], default: "Inactive" },   
    device_token:{ type: String, default: "" },    
  },
  { timestamps: true }
);

export default model("Admin", adminSchema);
