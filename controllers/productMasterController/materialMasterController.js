import { connectDB } from "../../connection/db.js";

// ======================= CREATE MATERIAL ===========================
export const createMaterial = async (req, res) => {
  try {
    const pool = await connectDB();
    const { name, is_custom = false, status = "active" } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Material name is required" });
    }

    const [result] = await pool.query(
      `INSERT INTO material_master (name, is_custom, status)
       VALUES (?, ?, ?)`,
      [name, is_custom, status],
    );

    res.status(201).json({
      message: "Material created successfully",
      material_id: result.insertId,
    });
  } catch (err) {
    console.error("Create Material Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL MATERIAL ===========================
export const getAllMaterial = async (req, res) => {
  try {
    const pool = await connectDB();

    const [rows] = await pool.query(
      `SELECT * FROM material_master ORDER BY id DESC`,
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Get All Material Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL ACTIVE MATERIAL ===========================
export const getAllActiveMaterial = async (req, res) => {
  try {
    const pool = await connectDB();

    const [rows] = await pool.query(
      `SELECT * FROM material_master 
       WHERE status = 'active'
       ORDER BY name ASC`,
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Active Material Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET MATERIAL BY ID ===========================
export const getMaterialById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM material_master WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Get Material By ID Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= UPDATE MATERIAL ===========================
export const updateMaterial = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM material_master WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Material not found" });
    }

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.keys(updates).map(
      (key) => updates[key] ?? existing[0][key],
    );

    values.push(id);

    const query = `UPDATE material_master SET ${fields} WHERE id = ?`;

    await pool.query(query, values);

    res.status(200).json({ message: "Material updated successfully" });
  } catch (err) {
    console.error("Update Material Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= DELETE MATERIAL ===========================
export const deleteMaterial = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT * FROM material_master WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Material not found" });
    }

    await pool.query(`DELETE FROM material_master WHERE id = ?`, [id]);

    res.status(200).json({ message: "Material deleted successfully" });
  } catch (err) {
    console.error("Delete Material Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
