import { Router } from "express";
import {
  createColor,
  getAllColor,
  getAllActiveColor,
  getColorById,
  updateColor,
  deleteColor,
} from "../../controllers/productMasterController/colorMasterController.js";

const router = Router();

// Create
router.post("/color", createColor);

// Update
router.patch("/color/:id", updateColor);

// Get All
router.get("/colors", getAllColor);

// Get All Active
router.get("/colors/active", getAllActiveColor);

// Get By ID
router.get("/color/:id", getColorById);

// Delete
router.delete("/color/:id", deleteColor);

export default router;
