import { text } from "express";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const subscriptionPackageSchema = new Schema(
  {   
      total_sales: { type:Number ,  },      
      max_product_add :{type: Number  },
      payment_time: { type: Number, default: 10 },
      package_price : {type: Number},
      high_priority: { type: Boolean, default: false, enum: [true, false]  }, 
      top_search:{ type: Boolean, default: false, enum: [true, false]  },
      supplier_tag:{ type: Boolean, default: false, enum: [true, false]  },
      created_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'admin'  },   
      package_status:{type: String, enum: ["Active", "Inactive"], default: "Active" },            
  },
  { timestamps: true }
);

export default model("SubscriptionPackage", subscriptionPackageSchema);
