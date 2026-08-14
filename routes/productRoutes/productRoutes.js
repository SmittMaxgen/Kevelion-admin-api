import express from "express";
import fs from "fs";
import AdmZip from "adm-zip";
import path from "path";

import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsBySubCategory,
  getProductsByBrand,
  getProductsBySeller,
  uploadProductsExcelLocalImages,
  getAllFeaturedProducts,
  getBestBrandByCategory,
  getTotalBrandByCategory,
  getProductInventory,
  getAllInventory,
  getProductBySellerId,
  getSellerReport,
  getVendorReport,
} from "../../controllers/productController/productController.js";
import { upload } from "../../middlewares/upload.js";

// ✅ File upload configuration for single product
const productUpload = upload.fields([
  { name: "f_image", maxCount: 1 },
  { name: "image_2", maxCount: 1 },
  { name: "image_3", maxCount: 1 },
  { name: "image_4", maxCount: 1 },
  { name: "product_catalogue", maxCount: 1 },
]);

// ✅ Handle both JSON and multipart/form-data
const handleFileUpload = (req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    productUpload(req, res, function (err) {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({
          message: "File upload error",
          error: err.message,
          field: err.field || null,
        });
      }

      // ✅ Safe logging AFTER Multer has processed the files
      console.log("Received body fields:", Object.keys(req.body || {}));
      console.log("Received files:", Object.keys(req.files || {}));

      next();
    });
  } else {
    next();
  }
};

const router = express.Router();

router.post("/product", handleFileUpload, createProduct);
router.patch("/product/:id", handleFileUpload, updateProduct);
router.delete("/product/:id", deleteProduct);
router.get("/products", getAllProducts);
router.get("/product/:id", getProductById);
router.get("/product/seller_id/:seller_id", getProductBySellerId);
router.get("/report/seller", getSellerReport);
router.get("/report/vendor", getVendorReport);
router.get("/report/admin", getSellerReport);
router.get("/product-inventory", getAllInventory);
router.get("/product/:product_id/inventory", getProductInventory);
router.get("/product_category/:id", getProductsByCategory);
router.get("/product_subcategory/:id", getProductsBySubCategory);
router.get("/product_brand/:brand", getProductsByBrand);
router.get("/featured_products", getAllFeaturedProducts);
router.get("/featured_product/:id", getProductById);
router.get("/product_seller/:id", getProductsBySeller);
router.get("/best_brand/:cat_id", getBestBrandByCategory);
router.get("/total_brand_by_category/:id", getTotalBrandByCategory);

// Excel + Images Upload Route
router.post(
  "/upload-excel-folder/:seller_id",
  upload.fields([
    { name: "excel", maxCount: 1 },
    { name: "images_zip", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const zipPath = req.files?.["images_zip"]?.[0]?.path;
      const extractTo = "uploads/excel-images/";

      if (zipPath) {
        const zip = new AdmZip(zipPath);
        zip.getEntries().forEach((entry) => {
          if (!entry.isDirectory) {
            const fileName = path.basename(entry.entryName);
            if (!fs.existsSync(extractTo)) {
              fs.mkdirSync(extractTo, { recursive: true });
            }
            const destPath = path.join(extractTo, fileName);
            fs.writeFileSync(destPath, entry.getData());
          }
        });
      }

      req.file = req.files?.["excel"]?.[0];
      await uploadProductsExcelLocalImages(req, res);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message });
    }
  },
);

export default router;
