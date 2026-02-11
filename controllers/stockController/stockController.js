import { connectDB } from "../../connection/db.js";

// ======================= CREATE STOCK ===========================
export const createStock = async (req, res) => {
  try {
    const pool = await connectDB();
    const { product_id, seller_id, quantity = 0 } = req.body;
    console.log(
      "product_id, seller_id, quantity ",
      product_id,
      seller_id,
      quantity,
    );
    const [existing] = await pool.query(
      `SELECT * FROM stock_management 
       WHERE product_id = ? AND seller_id = ?`,
      [product_id, seller_id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Stock already exists for this seller & product",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO stock_management (product_id, seller_id, quantity)
       VALUES (?, ?, ?)`,
      [product_id, seller_id, quantity],
    );

    res.status(201).json({
      message: "Stock created successfully",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL STOCK ===========================

export const getAllStock = async (req, res) => {
  try {
    const pool = await connectDB();

    const [rows] = await pool.query(`
      SELECT 
        sm.id,
        sm.quantity,

        sm.product_id,
        p.name AS product_name,

        sm.seller_id,
        s.name AS seller_name

      FROM stock_management sm
      JOIN product p ON sm.product_id = p.id
      JOIN seller s ON sm.seller_id = s.id
      ORDER BY sm.id DESC
    `);

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET STOCK BY SELLER ===========================

export const getStockBySeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const { seller_id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        sm.id,
        sm.quantity,

        sm.product_id,
        p.name AS product_name,

        sm.seller_id,
        s.name AS seller_name

      FROM stock_management sm
      JOIN product p ON sm.product_id = p.id
      JOIN seller s ON sm.seller_id = s.id
      WHERE sm.seller_id = ?
      ORDER BY sm.id DESC
      `,
      [seller_id],
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching stock by seller:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= PATCH STOCK (UPDATE QUANTITY) ===========================
export const updateStock = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const { quantity } = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM stock_management WHERE id = ?`,
      [id],
    );

    if (existing.length === 0)
      return res.status(404).json({ message: "Stock not found" });

    await pool.query(`UPDATE stock_management SET quantity = ? WHERE id = ?`, [
      quantity,
      id,
    ]);

    res.status(200).json({ message: "Stock updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= DELETE STOCK ===========================
export const deleteStock = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT * FROM stock_management WHERE id = ?`,
      [id],
    );

    if (existing.length === 0)
      return res.status(404).json({ message: "Stock not found" });

    await pool.query(`DELETE FROM stock_management WHERE id = ?`, [id]);

    res.status(200).json({ message: "Stock deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
