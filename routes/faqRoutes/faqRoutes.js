import { Router } from "express";
import {
  createFaq,
  getAllFaq,
  getAllActiveFaq,
  getFaqById,
  updateFaq,
  deleteFaq,
} from "../../controllers/faqController/faqController.js"; 
import { upload } from "../../middlewares/upload.js";

const router = Router();

// ===================== ROUTES =====================


// Create New Slider
router.post("/faq", createFaq);

// ✏️ Update Slider
router.patch("/faq/:id",updateFaq);

// 📋 Get All Sliders
router.get("/faqs", getAllFaq);

// 📋 Get All Active Sliders
router.get("/activefaq", getAllActiveFaq);

// 🔍 Get Slider By ID
router.get("/faq/:id", getFaqById);

// DELETE Slider
router.delete("/faq/:id", deleteFaq);

// ==================================================

export default router;
