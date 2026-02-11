import bcrypt from "bcrypt";
import { connectDB } from "../../connection/db.js";


// ======================= CREATE wishlist ===========================
export const createWishlist = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id, product_id, seller_id } = req.body;

    if (!buyer_id || !product_id || !seller_id) {
      return res.status(400).json({ message: "buyer_id , product_id, seller_id are required" });
    }

    // Create wishlist
    const [wishlistResult] = await pool.query(
      `INSERT INTO wishlist (buyer_id, product_id,seller_id) VALUES (?, ?, ?)`,
      [buyer_id, product_id, seller_id]
    );

    const wishlistId = wishlistResult.insertId;

    
    res.status(201).json({ message: "Wishlist created successfully", wishlist_id: wishlistId });
  } catch (err) {
    console.error("Error creating Wishlist:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ======================= GET ALL Wishlist ===========================
export const getAllWishlist = async (req, res) => {
  try {
    const pool = await connectDB();
    const [wishlists] = await pool.query(`SELECT * FROM wishlist ORDER BY id DESC`);    
   

    res.status(200).json(wishlists);
  } catch (err) {
    console.error("Error fetching wishlists:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET Wishlist BY ID ===========================
export const getDataById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [wishlists] = await pool.query(`SELECT * FROM wishlist WHERE id = ?`, [id]);
    if (wishlists.length === 0) return res.status(404).json({ message: "Wishlist  not found" });
    const wishlist = wishlists[0];
    

    res.status(200).json(wishlist);
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= DELETE wishlist ===========================
export const deleteWishlist = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    await pool.query(`DELETE FROM wishlist WHERE id = ?`, [id]);

    res.status(200).json({ message: "Wishlist deleted successfully" });
  } catch (err) {
    console.error("Error deleting wishlist:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= FILTER: BY BUYER ID ===========================
export const getAllWishlistByBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    const [wishlists] = await pool.query(`SELECT * FROM wishlist WHERE buyer_id = ?`, [buyer_id]);
    if (wishlists.length === 0) return res.status(404).json({ message: "No wishlist found for this buyer" });

    
    res.status(200).json(wishlists);
  } catch (err) {
    console.error("Error fetching buyer wishlist:", err);
    res.status(500).json({ message: "Server error" });
  }
};
