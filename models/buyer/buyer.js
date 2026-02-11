import mongoose from "mongoose";

const { Schema, model } = mongoose;

const buyerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, unique: true }, // changed to String (to preserve leading 0s)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    image: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Inactive" },
    approve_status: { type: String, enum: ["Approved", "Pending", "Unapproved"], default: "Pending" },
    is_online: { type: Number, enum: [0, 1], default: 0 }, // 0 = offline, 1 = online
    device_token:{ type: String, default: "" },
    company_name:{ type: String, default: "" },
    company_website:{ type: String, default: "" },
    IEC_code:{type: String, default: "" },    
    annual_turnover: { type: String, enum: ["Active", "Inactive", "OnLeave"], default: "Inactive" },
    company_GST_number:{ type: String, default: "" },
    facebook_link:{ type: String, default: "" },
    linkedin_link:{type: String, default: "" },
    insta_link :{type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },   

    //subscription: {type: Boolean, default: false, enum: [true, false]},

    // ✅ Nested KYC Details
    kyc_detail: {
      aadhar_Number: { type: String, default: "" },
      aadhar_front: { type: String, default: "" },
      aadhar_back: { type: String, default: "" },
      driving_license_Number: { type: String, default: "" },
      driving_license_dob: { type: String, default: "" },
      driving_license_front: { type: String, default: "" },
      driving_license_back: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default model("Buyer", buyerSchema);
