import { connectDB } from "../../connection/db.js";
import fs from "fs";

// Helper to get file path if uploaded
const getFilePath = (file) => (file ? `/uploads/${file.filename}` : "");

// ======================= CREATE PRODUCT SUBCATEGORY ===========================
export const createProductSubCategory = async (req, res) => {
  let conn;
  try {
    const { subcategory_name, category_id } = req.body;
    if (!subcategory_name || !category_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const image = getFilePath(req.file);

    const [result] = await conn.query(
      `INSERT INTO product_subcategory (subcategory_name, image, category_id)
       VALUES (?, ?, ?)`,
      [subcategory_name,  image, category_id]
    );

    await conn.commit();
    res.status(201).json({
      message: "Product subcategory created successfully",
      subcategory_id: result.insertId,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error creating product subcategory:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ======================= GET ALL PRODUCT SUBCATEGORIES ===========================
export const getAllProductSubCategories = async (req, res) => {
  try {
    const pool = await connectDB(); // use pool directly
    const [rows] = await pool.query(`
      SELECT ps.*, pc.category_name 
      
      FROM product_subcategory ps
      JOIN product_category pc ON ps.category_id = pc.id
      ORDER BY ps.id DESC
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET SUBCATEGORY BY ID ===========================
export const getProductSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT ps.*, pc.category_name 
       FROM product_subcategory ps 
       LEFT JOIN product_category pc ON ps.category_id = pc.id 
       WHERE ps.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product subcategory not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching subcategory:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// ======================= UPDATE PRODUCT SUBCATEGORY ===========================
export const updateProductSubCategory = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { subcategory_name, category_id } = req.body;

    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.query(`SELECT * FROM product_subcategory WHERE id = ?`, [id]);
    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Product subcategory not found" });
    }

    const image = req.file ? getFilePath(req.file) : existing[0].image;

    await conn.query(
      `UPDATE product_subcategory SET 
        subcategory_name = ?, 
        image = ?, 
        category_id = ?
       WHERE id = ?`,
      [
        subcategory_name ?? existing[0].subcategory_name,
        image,
        category_id ?? existing[0].category_id,
        id,
      ]
    );

    await conn.commit();
    res.status(200).json({ message: "Product subcategory updated successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error updating product subcategory:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ======================= DELETE PRODUCT SUBCATEGORY ===========================
export const deleteProductSubCategory = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.query(`SELECT * FROM product_subcategory WHERE id = ?`, [id]);
    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Product subcategory not found" });
    }

    if (existing[0].image && fs.existsSync(`.${existing[0].image}`)) {
      fs.unlinkSync(`.${existing[0].image}`);
    }

    await conn.query(`DELETE FROM product_subcategory WHERE id = ?`, [id]);
    await conn.commit();

    res.status(200).json({ message: "Product subcategory deleted successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error deleting product subcategory:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ======================= GET top  SUBCATEGORIES ===========================
export const getTopSubCategories = async (req, res) => {
  try {
    const pool = await connectDB(); // use pool directly
    const [rows] = await pool.query(`
      SELECT 
    sc.id,
    sc.subcategory_name,
    sc.image,
    sc.category_id,
    COUNT(p.id) AS total_products
FROM product_subcategory sc
JOIN product p 
    ON p.cat_sub_id = sc.id
WHERE p.status = 'Active'
GROUP BY 
    sc.id,
    sc.subcategory_name,
    sc.image,
    sc.category_id
ORDER BY total_products ASC
LIMIT 6;
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching top subcategories:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



