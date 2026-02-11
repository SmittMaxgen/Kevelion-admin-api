import { Router } from "express";
import multer from "multer";
import {
  createProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  updateProductCategory,
  deleteProductCategory,
  getTotalProductCount,
  getAllSubCategoriesByCatID,
} from "../../controllers/productController/productCategoryController.js";

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

// ➕ Create Category (with image)
router.post("/category", upload.single("image"), createProductCategory);

// 📋 Get All Categories
router.get("/categories", getAllProductCategories);

// 🔍 Get Category by ID
router.get("/category/:id", getProductCategoryById);

// 🔍 Get subcategory by cat ID
router.get("/category/:cat_id/subcategory", getAllSubCategoriesByCatID);

// ✏️ Update Category (with image)
router.patch("/category/:id", upload.single("image"), updateProductCategory);

// 🗑️ Delete Category
router.delete("/category/:id", deleteProductCategory);

//Get total product by category id
// 🔍 Get Category by ID
router.get("/ProductCount/:cat_id", getTotalProductCount);


export default router;
