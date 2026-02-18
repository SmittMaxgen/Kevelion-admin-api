import { Router } from "express";
import {
  createPayment,
  paymentSuccess,
  paymentCancel,
} from "../../controllers/payPalController/payPalController.js";

const router = Router();

router.post("/paypal/pay", createPayment);
router.get("/paypal/success", paymentSuccess);
router.get("/paypal/cancel", paymentCancel);

export default router;
