import { connectDB } from "../../connection/db.js";

export const createFinish = async (req, res) => {
  try {
    const pool = await connectDB();
    const { name, is_custom = false, status = "active" } = req.body;

    const [result] = await pool.query(
      `INSERT INTO finish_master (name, is_custom, status)
       VALUES (?, ?, ?)`,
      [name, is_custom, status]
    );

    res.status(201).json({ message: "Finish created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllFinish = async (req, res) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT * FROM finish_master ORDER BY id DESC`
  );
  res.json(rows);
};

export const getAllActiveFinish = async (req, res) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT * FROM finish_master WHERE status='active'`
  );
  res.json(rows);
};

export const getFinishById = async (req, res) => {
  const pool = await connectDB();
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT * FROM finish_master WHERE id=?`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ message: "Not found" });
  res.json(rows[0]);
};

export const updateFinish = async (req, res) => {
  const pool = await connectDB();
  const { id } = req.params;
  const updates = req.body;

  const fields = Object.keys(updates)
    .map((key) => `${key}=?`)
    .join(", ");

  const values = Object.values(updates);
  values.push(id);

  await pool.query(
    `UPDATE finish_master SET ${fields} WHERE id=?`,
    values
  );

  res.json({ message: "Finish updated successfully" });
};

export const deleteFinish = async (req, res) => {
  const pool = await connectDB();
  const { id } = req.params;

  await pool.query(`DELETE FROM finish_master WHERE id=?`, [id]);
  res.json({ message: "Finish deleted successfully" });
};
