import { connectDB } from "../../connection/db.js";
import fs from "fs";

// Helper to get file path if uploaded
const getFilePath = (file) => (file ? `/uploads/${file.filename}` : "");

// ======================= CREATE PRODUCT CATEGORY ===========================
export const createProductCategory = async (req, res) => {
  let conn;
  try {
    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const { category_name } = req.body;

    if (!category_name)
      return res.status(400).json({ message: "Category name is required" });

    
    const image = getFilePath(req.file);

    const [result] = await conn.query(
      `INSERT INTO product_category (category_name, image) VALUES (?, ?)`,
      [category_name, image]
    );

    await conn.commit();
    res.status(201).json({ message: "Product category created", category_id: result.insertId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error creating product category:", err.code, err.sqlMessage);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ======================= GET ALL PRODUCT CATEGORIES ===========================
export const getAllProductCategories = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(`SELECT * FROM product_category ORDER BY id DESC`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching product categories:", err.code, err.sqlMessage);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET PRODUCT CATEGORY BY ID ===========================
export const getProductCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query(`SELECT * FROM product_category WHERE id = ?`, [id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Product category not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching product category:", err.code, err.sqlMessage);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= UPDATE PRODUCT CATEGORY ===========================
export const updateProductCategory = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { category_name } = req.body;

    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.query(`SELECT * FROM product_category WHERE id = ?`, [id]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Product category not found" });

    const image = req.file ? getFilePath(req.file) : existing[0].image;

    await conn.query(
      `UPDATE product_category SET category_name = ?,  image = ? WHERE id = ?`,
      [
        category_name ?? existing[0].category_name,
        image,
        id,
      ]
    );

    await conn.commit();
    res.status(200).json({ message: "Product category updated successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error updating product category:", err.code, err.sqlMessage);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ======================= DELETE PRODUCT CATEGORY ===========================
export const deleteProductCategory = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;

    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.query(`SELECT * FROM product_category WHERE id = ?`, [id]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Product category not found" });

    // Optionally delete image file from server
    if (existing[0].image && fs.existsSync(`.${existing[0].image}`)) {
      fs.unlinkSync(`.${existing[0].image}`);
    }

    await conn.query(`DELETE FROM product_category WHERE id = ?`, [id]);
    await conn.commit();

    res.status(200).json({ message: "Product category deleted successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error deleting product category:", err.code, err.sqlMessage);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ======================= Get total  PRODUCT of  CATEGORY ===========================
export const getTotalProductCount = async (req, res) => {
  try {
    const { cat_id } = req.params;
    const pool = await connectDB();

    // First check if category exists in products table
    const [exists] = await pool.query(
      "SELECT 1 FROM product WHERE FIND_IN_SET(?, cat_id) LIMIT 1",
      [cat_id]
    );

    if (exists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // If exists → get product count
    const [rows] = await pool.query(
     "SELECT COUNT(*) AS total_products FROM product WHERE cat_id = ?",
      [cat_id]
    );

    // 3️⃣ Get category-wise brand count
    const [brands] = await pool.query(
      "SELECT COUNT(DISTINCT brand) AS total_brands FROM product WHERE cat_id = ?",
  [cat_id]
    );

    return res.status(200).json({
      success: true,
      total_products: rows[0].total_products,
      total_brands: brands[0].total_brands
    });
    
    

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
//==========GET ALL SUB CATEGORY BY CATEGORY ID==================
export const getAllSubCategoriesByCatID = async (req, res) => {
  try {
        const { cat_id } = req.params;
      
    const pool = await connectDB(); // use pool directly
    
    const [rows] = await pool.query(`
      SELECT ps.*, pc.category_name 
      
      FROM product_subcategory ps
      JOIN product_category pc ON ps.category_id = pc.id
      WHERE ps.category_id = ? 
      ORDER BY ps.id DESC`,[cat_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};










