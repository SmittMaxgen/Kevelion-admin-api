import { Router } from "express";
import {
  createSubscriptionPackage,
  updateSubscriptionPackage,
  getAllSubscriptionPackages,
  deleteSubscriptionPackage,
  getSubscriptionPackageById,
  setFreePlanPackage,
} from "../../controllers/subscriptionPackageController/subscriptionPackageController.js"; // ✅ Update path as needed

const router = Router();

// ===================== ROUTES =====================

// ➕ Create New Subscription Package
router.post("/subscription-package", createSubscriptionPackage);

// ✏️ Update Subscription Package
router.patch("/subscription-package/:id", updateSubscriptionPackage);

// ✏️ Update Subscription Package's Free Plan Status
router.patch("/subscription-package/:id/set-free-plan", setFreePlanPackage);

// 📋 Get All Subscription Packages
router.get("/subscription-packages", getAllSubscriptionPackages);

// 🔍 Get Subscription Package By ID
router.get("/subscription-package/:id", getSubscriptionPackageById);

// 🗑️ Delete Subscription Package
router.delete("/subscription-package/:id", deleteSubscriptionPackage);

// ==================================================

export default router;
