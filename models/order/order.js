import { text } from "express";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const orderSchema = new Schema(
  {
    products: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },      
      seller_id :{type: mongoose.Schema.Types.ObjectId, ref: 'seller_id' },
      quantity: { type: Number, default: 1 },
      price: { type: Number, required: true }, // price at time of order
      order_status:{ type: String, enum: ["New", "Pending", "Delivered"], default: "New"  },
    payment_status:{ type: String, enum: ["Pending", "Done"], default: "Pending"  },
    }
  ],
    buyer_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'buyer_id'  },   
    order_type:{type: String, enum: ["Order", "Inquiry"], default: "Inquiry" }, 
           
  },
  { timestamps: true }
);

export default model("Order", orderSchema);
