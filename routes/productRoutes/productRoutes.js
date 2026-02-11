import express from "express";
import fs from "fs";
import multer from "multer";
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
} from "../../controllers/productController/productController.js";
import { upload } from "../../middlewares/upload.js";


// ✅ File upload configuration (multer)
const productUpload = upload.fields([
  { name: "f_image", maxCount: 1 },
  { name: "image_2", maxCount: 1 },
  { name: "image_3", maxCount: 1 },
  { name: "image_4", maxCount: 1 },
]);

// ✅ Handle both JSON and multipart/form-data
const handleFileUpload = (req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    productUpload(req, res, function (err) {
      if (err) {
        return res
          .status(400)
          .json({ message: "File upload error", error: err.message });
      }
      next();
    });
  } else {
    next();
  }
};

const router = express.Router();

router.post("/product",handleFileUpload, createProduct);
router.patch("/product/:id",handleFileUpload, updateProduct);
router.delete("/product/:id", deleteProduct);
router.get("/products", getAllProducts);
router.get("/product/:id", getProductById);
router.get("/product_category/:id", getProductsByCategory);
router.get("/product_subcategory/:id", getProductsBySubCategory);
router.get("/product_brand/:brand", getProductsByBrand);
router.get("/featured_products", getAllFeaturedProducts);

router.get("/featured_product/:id", getProductById);

router.get("/product_seller/:id", getProductsBySeller);
router.get("/best_brand/:cat_id", getBestBrandByCategory);
router.get("/total_brand_by_category/:id", getTotalBrandByCategory);

router.post(
  "/upload-excel-folder/:seller_id",
  upload.fields([
    { name: "excel", maxCount: 1 },
    { name: "images_zip", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // ✅ 1️⃣ Extract ZIP
      const zipPath = req.files["images_zip"]?.[0]?.path;
      const extractTo = "uploads/excel-images/";

      if (zipPath) {
        const zip = new AdmZip(zipPath);

        zip.getEntries().forEach((entry) => {
        if (!entry.isDirectory) {
           // Only process files, ignore folders
             const fileName = path.basename(entry.entryName); // remove any folder path inside ZIP
             
             // Ensure target folder exists
      if (!fs.existsSync(extractTo)) {
        fs.mkdirSync(extractTo, { recursive: true });
      }
            const destPath = path.join(extractTo, fileName);
            fs.writeFileSync(destPath, entry.getData());
            }
        });
}

      // ✅ 2️⃣ Call your existing Excel + image importer
      req.file = req.files["excel"]?.[0];
      await uploadProductsExcelLocalImages(req, res);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);





export default router;
