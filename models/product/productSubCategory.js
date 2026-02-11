import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productSubCategorySchema = new Schema(
  {
    subcategory_name: { type: String, required: true, trim: true },     
    subcategory_sku: { type: String, required: true, trim: true },  
    image: { type: String, default: "" },      
    category_id : {type:mongoose.Schema.Types.ObjectId, required: true, ref: 'ProductCategory'}    
  },
  { timestamps: true }
);

//68d64582f9732da344fe8cd6
export default model("ProductSubCategory", productSubCategorySchema);
