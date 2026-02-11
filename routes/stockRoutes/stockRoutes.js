import express from "express";
import {
  createStock,
  getAllStock,
  getStockBySeller,
  updateStock,
  deleteStock,
} from "../../controllers/stockController/stockController.js";

const router = express.Router();

router.post("/stock", createStock); // POST
router.get("/stock", getAllStock); // GET all
router.get("/stock/:seller_id", getStockBySeller); // GET by seller
router.patch("stock/:id", updateStock); // PATCH
router.delete("stock/:id", deleteStock); // DELETE

export default router;
