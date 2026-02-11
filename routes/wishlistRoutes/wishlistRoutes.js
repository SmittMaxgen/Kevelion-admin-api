import { Router } from "express";
import {
  createWishlist,
  getDataById,
  deleteWishlist,
  getAllWishlist,
  getAllWishlistByBuyer,

} from "../../controllers/wishlistController/wishlistController.js";

const router = Router();

// Routes

router.post( "/wishlist",  createWishlist);

router.get("/wishlists", getAllWishlist);

router.get("/wishlistbuyer/:buyer_id", getAllWishlistByBuyer);

router.get("/wishlist/:id", getDataById);
router.delete("/wishlist/:id", deleteWishlist);

export default router

