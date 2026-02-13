import { connectDB } from "../../connection/db.js";

export const createCountry = async (req, res) => {
  try {
    const pool = await connectDB();
    const { name, status = "active" } = req.body;

    const [result] = await pool.query(
      `INSERT INTO country_master (name, status)
       VALUES (?, ?)`,
      [name, status],
    );

    res.status(201).json({ message: "Country created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllCountry = async (req, res) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT * FROM country_master ORDER BY id DESC`,
  );
  res.json(rows);
};

export const getAllActiveCountry = async (req, res) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT * FROM country_master WHERE status='active'`,
  );
  res.json(rows);
};

export const getCountryById = async (req, res) => {
  const pool = await connectDB();
  const { id } = req.params;

  const [rows] = await pool.query(`SELECT * FROM country_master WHERE id=?`, [
    id,
  ]);

  if (!rows.length)
    return res.status(404).json({ message: "Country not found" });

  res.json(rows[0]);
};

export const updateCountry = async (req, res) => {
  const pool = await connectDB();
  const { id } = req.params;
  const updates = req.body;

  const fields = Object.keys(updates)
    .map((key) => `${key}=?`)
    .join(", ");

  const values = Object.values(updates);
  values.push(id);

  await pool.query(`UPDATE country_master SET ${fields} WHERE id=?`, values);

  res.json({ message: "Country updated successfully" });
};

export const deleteCountry = async (req, res) => {
  const pool = await connectDB();
  const { id } = req.params;

  await pool.query(`DELETE FROM country_master WHERE id=?`, [id]);

  res.json({ message: "Country deleted successfully" });
};
