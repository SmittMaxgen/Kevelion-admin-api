import { connectDB } from "../../connection/db.js";

// ================= CREATE =================
export const createColor = async (req, res) => {
  try {
    const pool = await connectDB();
    const { name, is_custom = false, status = "active" } = req.body;

    const [result] = await pool.query(
      `INSERT INTO color_master (name, is_custom, status)
       VALUES (?, ?, ?)`,
      [name, is_custom, status],
    );

    res.status(201).json({
      message: "Color created",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Create Color Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET ALL =================
export const getAllColor = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT * FROM color_master ORDER BY id DESC`,
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ACTIVE =================
export const getAllActiveColor = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT * FROM color_master WHERE status='active' ORDER BY name ASC`,
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET BY ID =================
export const getColorById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM color_master WHERE id=?`, [
      id,
    ]);

    if (!rows.length)
      return res.status(404).json({ message: "Color not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE =================
export const updateColor = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM color_master WHERE id=?`,
      [id],
    );

    if (!existing.length)
      return res.status(404).json({ message: "Color not found" });

    const fields = Object.keys(updates)
      .map((key) => `${key}=?`)
      .join(", ");

    const values = Object.keys(updates).map(
      (key) => updates[key] ?? existing[0][key],
    );

    values.push(id);

    await pool.query(`UPDATE color_master SET ${fields} WHERE id=?`, values);

    res.status(200).json({ message: "Color updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= DELETE =================
export const deleteColor = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    await pool.query(`DELETE FROM color_master WHERE id=?`, [id]);

    res.status(200).json({ message: "Color deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
