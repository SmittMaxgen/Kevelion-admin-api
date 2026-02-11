import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sellerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, unique: true }, // changed to String (to preserve leading 0s)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },    
    status: { type: String, enum: ["Active", "Inactive"], default: "Inactive" },
    approve_status: { type: String, enum: ["Approved", "Pending", "Rejected"], default: "Pending" },
    device_token:{ type: String, default: "" },
    company_name:{ type: String, default: "" },
    company_type: { type: String, enum: ["Proprietorship", "Partnership", "Limited Liability Partnership (LLP)","Private Limited Company","Public Limited Company","Proprietorship Firm","MSME","other"], default: "other" },
    company_GST_number:{ type: String, default: "" },
    company_logo: { type: String, default: "" },
    company_website:{ type: String, default: "" },
    IEC_code:{type: String, default: "" },    
    annual_turnover: { type: String, enum: ["below_20_lakh", "20-50_lakh", "50-1_cr","1-5_cr","5-10_cr","10-20_cr"], default: "below_20_lakh" },
    company_GST_number:{ type: String, default: "" },
    facebook_link:{ type: String, default: "" },
    linkedin_link:{type: String, default: "" },
    insta_link :{type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    
    subscription: {type: Boolean, default: false, enum: [true, false]},
    subscription_package_id :{type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPackage'},

    // ✅ Nested KYC Details
    kyc_detail: {
      aadhar_Number: { type: String, default: "" },
      aadhar_front: { type: String, default: "" },
      aadhar_back: { type: String, default: "" },
      company_registration: { type: String, default: "" },
      company_pan_card: { type: String, default: "" },
      gst_certificate: { type: String, default: "" },
    },
    //bank detail
    bank_detail:{
      cancelled_cheque_photo: { type: String, default: "" },
      bank_name: { type: String, default: "" },
      bank_IFSC_code: { type: String, default: "" },
      account_number: { type: String, default: "" },      
      account_type: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default model("Seller", sellerSchema);
