import { Router } from "express";
import multer from "multer";
import {
  createProductSubCategory,
  getAllProductSubCategories,
  getProductSubCategoryById,
  updateProductSubCategory,
  deleteProductSubCategory,
  getTopSubCategories,
} from "../../controllers/productController/productSubCategoryController.js";

const router = Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/"),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, Date.now() + "." + ext);
  },
});

const upload = multer({ storage });

// ➕ Create Subcategory
router.post("/subcategory", upload.single("image"), createProductSubCategory);

// 📋 Get All Subcategories
router.get("/subcategories", getAllProductSubCategories);

// 📋 Get All Top Subcategories
router.get("/topsubcategories", getTopSubCategories);

// 🔍 Get Subcategory by ID
router.get("/subcategory/:id", getProductSubCategoryById);

// ✏️ Update Subcategory
router.patch("/subcategory/:id", upload.single("image"), updateProductSubCategory);

// 🗑️ Delete Subcategory
router.delete("/subcategory/:id", deleteProductSubCategory);

export default router;
