import { Router } from "express";
import multer from "multer";
import {
  createProductReview,
  getProductReviews,
  getVendorReviews,
  updateProductReview,
  getProductRating,
  getVendorRating,
  deleteProductReview,
} from "../../controllers/productController/productReviewController.js";

const router = Router();


// ➕ Create Review 
router.post("/review",  createProductReview);

// 📋 Get All Review
router.get("/reviews/:product_id", getProductReviews);

// 🔍 Get All Reviews for Vendor
router.get("/vendor_reviews/:seller_id", getVendorReviews);

//GET AVG product rating
router.get("/product_rating/:product_id", getProductRating);

//GET AVG vendor rating
router.get("/vendor_rating/:seller_id", getVendorRating);

// ✏️ Update Review 
router.patch("/review/:review_id", updateProductReview);

// 🗑️ Delete Review
router.delete("/review/:id", deleteProductReview);

export default router;
