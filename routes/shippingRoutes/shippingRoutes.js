import { Router } from "express";
import {
  createShippingEntries,
  updateShippingBySeller,
  getShippingByOrder,
} from "../../controllers/shippingController/shippingController.js";

const router = Router();

// 1️⃣ Create all shipping entries when a new order is placed
router.post("/shipping/", createShippingEntries);

// 2️⃣ Seller updates their shipment (tracking, courier, cost, etc.)
router.patch("/shipping/:order_id/:seller_id", updateShippingBySeller);

// 3️⃣ Get all shipping details for an order (admin/user view)
router.get("/ordershipping/:order_id", getShippingByOrder);

export default router;
