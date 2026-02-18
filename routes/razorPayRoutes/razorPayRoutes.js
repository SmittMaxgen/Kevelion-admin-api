import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment,
} from "../../controllers/razorPayController/razorPayController.js";

const router = Router();

router.post("/razorpay/order", createOrder); // Create order
router.post("/razorpay/verify", verifyPayment); // Verify payment
router.get("/razorpay/payment/:payment_id", getPaymentDetails); // Get details
router.post("/razorpay/refund/:payment_id", refundPayment); // Refund

export default router;
