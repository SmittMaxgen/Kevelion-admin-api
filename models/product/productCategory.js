import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productCategorySchema = new Schema(
  {
    category_name: { type: String, required: true, trim: true },  
    category_sku: { type: String, required: true, trim: true },    
    image: { type: String, default: "" },      
    
    
  },
  { timestamps: true }
);

export default model("ProductCategory", productCategorySchema);
