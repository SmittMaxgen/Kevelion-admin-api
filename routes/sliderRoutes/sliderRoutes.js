import { Router } from "express";
import {
  createSlider,
  getAllSlider,
  getAllActiveSlider,
  getSliderById,
  updateSlider,
  deleteSlider,
} from "../../controllers/sliderController/sliderController.js"; 
import { upload } from "../../middlewares/upload.js";


// Accept  files for slider
const sliderUpload = upload.fields([
  { name: "banner_image", maxCount: 1 },                 // Profile photo
]);
const router = Router();

// ===================== ROUTES =====================


// Create New Slider
router.post("/slider",(req, res, next) => {
    // If content type is multipart -> use multer
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      sliderUpload(req, res, function (err) {
        if (err) {
          return res
            .status(400)
            .json({ message: "File upload error", error: err });
        }
        next();
      });
    } else {
      // For JSON requests, just continue
      next();
    }
  }, createSlider);

// ✏️ Update Slider
router.patch("/slider/:id",
    (req, res, next) => {
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      sliderUpload(req, res, function (err) {
        if (err) {
          return res
            .status(400)
            .json({ message: "File upload error", error: err });
        }
        next();
      });
    } else {
      next();
    }
  }, updateSlider);

// 📋 Get All Sliders
router.get("/sliders", getAllSlider);

// 📋 Get All Active Sliders
router.get("/activesliders", getAllActiveSlider);

// 🔍 Get Slider By ID
router.get("/slider/:id", getSliderById);

// DELETE Slider
router.delete("/slider/:id", deleteSlider);

// ==================================================

export default router;
