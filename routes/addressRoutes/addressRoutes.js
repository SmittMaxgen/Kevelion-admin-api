import { Router } from "express";
import {
  createAddress,
  getAllAddressByByer,
  getAddressById,
  getAllAddress,
  updateAddress,
  deleteAddress,
} from "../../controllers/addressController/addressController.js"; 

const router = Router();

// ===================== ROUTES =====================


// Create New Address
router.post("/address", createAddress);

// ✏️ Update Address
router.patch("/address/:id", updateAddress);

// 📋 Get All Address
router.get("/address", getAllAddress);

// 📋 Get All Address by buyer
router.get("/address/buyer/:buyer_id", getAllAddressByByer);

// 🔍 Get Address By ID
router.get("/address/:id", getAddressById);

// DELETE address
router.delete("/address/:id", deleteAddress);

// ==================================================

export default router;
