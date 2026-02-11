import { Router } from "express";
import {
  createOrder,
  getDataById,
  deleteOrder,
  getAllOrder,
  updateOrder,
  getAllOrderByBuyer,
  getAllOrderBySeller,
  getAllOrderInquiry,
  updateOrderProductStatus,
getAllOrderOrdertype,
} from "../../controllers/orderController/orderController.js";

const router = Router();

// Routes

router.post( "/order",  createOrder);

router.patch("/order/:id", updateOrder);
router.patch("/orderProduct/:order_product_id", updateOrderProductStatus);

router.get("/orders", getAllOrder);
router.get("/ordersInquiry", getAllOrderInquiry);
router.get("/ordersOrderType", getAllOrderOrdertype);


router.get("/orderbuyer/:buyer_id", getAllOrderByBuyer);
router.get("/orderseller/:seller_id", getAllOrderBySeller);

router.get("/order/:id", getDataById);
router.delete("/order/:id", deleteOrder);

export default router

