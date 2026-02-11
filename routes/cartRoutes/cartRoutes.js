import { Router } from "express";
import {
  createCart,
  addToCart,
  updateCart,
  getAllCarts,
  getCartById,
  getCartByBuyerId,
  deleteCart,
  removeCartItem,
  removeCartByBuyerId,
  changeCartQty,
} from "../../controllers/cartController/cartController.js";

const router = Router();

// Routes

router.post( "/cart",  createCart);

//add cart item
router.post( "/addcart",  addToCart);

//add/remove from cart page
router.post( "/changecartqty",  changeCartQty);

router.patch("/cart", updateCart);

router.get("/cart", getAllCarts);

router.get("/cart/:id", getCartById);

router.get("/cart/buyer/:buyer_id", getCartByBuyerId);
//delete whole cART BY BUYER ID 

router.delete("/cart/buyer/:buyer_id", removeCartByBuyerId);

//router.get("/cart/:id", getCartById);
router.delete("/cart/:cart_id", deleteCart);

router.delete("/cart/item/:item_id", removeCartItem)
export default router

