import { Router } from "express";

import jwt from "jsonwebtoken";
import {
  createSeller,
  updateSeller,
  getAllSellers,
  deleteSeller,
  getSellerById,
  getAllPendingSellers,
  approveVendorPackage,
  renewOrUpgradePackage,
  getVendorPackages,
  getAllSellerswithPackage,
  sellerLogin,
  sendLoginOtp,
  verifyOtp,
} from "../../controllers/sellerController/sellerControlller.js";
import { upload } from "../../middlewares/upload.js";

const router = Router();



// ✅ File upload configuration (Multer)
const sellerUpload = upload.fields([
  { name: "company_logo", maxCount: 1 },
  { name: "aadhar_front", maxCount: 1 },
  { name: "aadhar_back", maxCount: 1 },
  { name: "company_registration", maxCount: 1 },
  { name: "company_pan_card", maxCount: 1 },
  { name: "gst_certificate", maxCount: 1 },
  { name: "cancelled_cheque_photo", maxCount: 1 },
]);

// ✅ Unified Middleware: works with both JSON & FormData
const handleFileUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("multipart/form-data")) {
    sellerUpload(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          message: "File upload error",
          error: err.message,
        });
      }
      next();
    });
  } else {
    // Ensure req.files exists in JSON mode
    req.files = {};
    next();
  }
};

// ===================== ROUTES =====================

// ➕ Create New Seller
router.post("/seller", handleFileUpload, createSeller);

// ✏️ Update Seller (supports JSON or file upload)
router.patch("/seller/:id", handleFileUpload, updateSeller);

// 📋 Get All Sellers
router.get("/sellers", getAllSellers);

// 📋 Get All Sellers with Package details
router.get("/sellerswithPackage", getAllSellerswithPackage);

// 📋 Get All Pending Sellers
router.get("/sellers/pending", getAllPendingSellers);

// 🔍 Get Seller By ID
router.get("/seller/:id", getSellerById);

// 🗑️ Delete Seller
router.delete("/seller/:id", deleteSeller);

// Admin approve & activate vendor package
router.post("/seller/approve-package", approveVendorPackage);

// RENEW OR UPGRADE PACKAGE 
router.post("/seller/renew-package", renewOrUpgradePackage);

// seller login
router.post("/seller-login", sellerLogin);

// send login otp
router.post("/seller/login/send-otp", sendLoginOtp);

// verify Otp
router.post("/seller/login/verify-otp", verifyOtp);

// seller package history 
router.get("/seller/package-history/:seller_id", getVendorPackages);


// ==================================================
export default router;
