import { connectDB } from "../../connection/db.js";
import fs from "fs";



// ======================= CREATE PRODUCT Review ===========================
export const createProductReview = async (req, res) => {
  let conn;
  try {
    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const { product_id, seller_id, buyer_id, rating, review } = req.body;

        if (!product_id || !seller_id || !buyer_id || !rating) {
            return res.status(400).json({ 
                message: "product_id, seller_id, buyer_id and rating are required" 
            });
        }

        await pool.query(
            `INSERT INTO product_reviews 
             (product_id, seller_id, buyer_id, rating, review)
             VALUES (?, ?, ?, ?, ?)`,
            [product_id, seller_id, buyer_id, rating, review]
        );

        res.json({ message: "Review added successfully", created: true });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }   
};

// ======================= GET  PRODUCT aLL Review ===========================
export const getProductReviews = async (req, res) => {
    try {
        const pool = await connectDB();
        const { product_id } = req.params;

        const [reviews] = await pool.query(
            `SELECT r.*, b.name AS buyer_name 
             FROM product_reviews r
             LEFT JOIN buyer b ON b.id = r.buyer_id
             WHERE r.product_id = ?
             ORDER BY r.id DESC`,
            [product_id]
        );

        res.json({ reviews });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ======================= Get All Reviews for Vendor ===========================
export const getVendorReviews = async (req, res) => {
    try {
        const pool = await connectDB();
        const { seller_id } = req.params;

        const [reviews] = await pool.query(
            `SELECT r.*, p.name, b.name AS buyer_name
             FROM product_reviews r
             LEFT JOIN product p ON p.id = r.product_id
             LEFT JOIN buyer b ON b.id = r.buyer_id
             WHERE r.seller_id = ?
             ORDER BY r.id DESC`,
            [seller_id]
        );

        res.json({ reviews });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// ======================= Vendor Average Rating ===========================
export const getVendorRating = async (req, res) => {
    try {
        const pool = await connectDB();
        const { seller_id } = req.params;

        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) AS total_reviews,
                AVG(rating) AS avg_rating 
             FROM product_reviews 
             WHERE seller_id = ?`,
            [seller_id]
        );

        res.json({
            total_reviews: rows[0].total_reviews,
            avg_rating: parseFloat(rows[0].avg_rating || 0).toFixed(1)
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ======================= Product Average Rating ===========================
export const getProductRating = async (req, res) => {
    try {
        const pool = await connectDB();
        const { product_id } = req.params;

        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) AS total_reviews,
                AVG(rating) AS avg_rating 
             FROM product_reviews 
             WHERE product_id = ?`,
            [product_id]
        );

        res.json({
            total_reviews: rows[0].total_reviews,
            avg_rating: parseFloat(rows[0].avg_rating || 0).toFixed(1)
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// ======================= DELETE PRODUCT Review ===========================
export const deleteProductReview = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;

    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.query(`SELECT * FROM product_reviews WHERE id = ?`, [id]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Review  not found" });

    await conn.query(`DELETE FROM product_reviews WHERE id = ?`, [id]);
    await conn.commit();

    res.status(200).json({ message: "Product Review deleted successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error deleting product Review:", err.code, err.sqlMessage);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

//================update review=====================
export const updateProductReview = async (req, res) => {
    try {
        const pool = await connectDB();
       const { review_id } = req.params;
        const { rating, review } = req.body;

        if (!review_id || !rating) {
            return res.status(400).json({
                message: "review_id and rating are required"
            });
        }

        // Check review exists
        const [existing] = await pool.query(
            "SELECT * FROM product_reviews WHERE id = ?",
            [review_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Update rating + review text
        await pool.query(
            `UPDATE product_reviews 
             SET rating = ?, review = ? 
             WHERE id = ?`,
            [rating, review, review_id]
        );

        res.json({ message: "Review updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};