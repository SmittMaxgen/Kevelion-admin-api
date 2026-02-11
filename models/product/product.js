import { text } from "express";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const pricingTierSchema = new mongoose.Schema({
  min_quantity: { type: Number, required: true },
  max_quantity: { type: Number, default: null }, // null = no upper limit
  price_per_unit: { type: Number, required: true }
});


const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true }, // changed to String (to preserve leading 0s)    
    status: { type: String, enum: ["Active", "Inactive"], default: "Inactive" },
    detail:{ type: String, default: "" },
    pricing_tiers: [pricingTierSchema],
    moq:{ type: Number, default: "" },
    cat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' }, 
    cat_sub_id:{ type: mongoose.Schema.Types.ObjectId, ref: "ProductSubCategory" },
    f_image:{ type: String, default: "" },
    image_2: { type: String, default: "" },
    image_3: { type: String, default: "" },
    image_4: { type: String, default: "" },
    product_catalogue: { type: String, default: "" },
    brand: { type: String, default: "" },
    material: { type: String, default: "" },
    made_in: { type: String, default: "" },
    specification: { type: String, default: "" },
    warranty: { type: String, default: "" },   
    seller_id:{ type: mongoose.Schema.Types.ObjectId, ref: "seller" },    
    highlight:{type: String, enum: ["Yes", "No"], default: "No" }
  },
  { timestamps: true }
);

export default model("Product", productSchema);
