import { Router } from "express";
import {
  createMaterial,
  getAllMaterial,
  getAllActiveMaterial,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} from "../../controllers/productMasterController/materialMasterController.js";

const router = Router();

// ===================== ROUTES =====================

// Create Material
router.post("/material", createMaterial);

// Update Material
router.patch("/material/:id", updateMaterial);

// Get All Materials
router.get("/materials", getAllMaterial);

// Get All Active Materials
router.get("/materials/active", getAllActiveMaterial);

// Get Material By ID
router.get("/material/:id", getMaterialById);

// Delete Material
router.delete("/material/:id", deleteMaterial);

export default router;
