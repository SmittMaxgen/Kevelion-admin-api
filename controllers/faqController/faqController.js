import { connectDB } from "../../connection/db.js";

// ======================= CREATE faq ===========================
export const createFaq = async (req, res) => {
  try {
    const pool = await connectDB();
    const {
      question,
      answer,
      status = "inactive",
    } = req.body;

  
    const [result] = await pool.query(
      `INSERT INTO faq
        (question,answer,status)
       VALUES (?, ?, ? )`,
      [
        question,
        answer,
        status,
      ]
    );

    res.status(201).json({ message: "Faq created", faq_id: result.insertId });
  } catch (err) {
    console.error("Error creating faq:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL faq ===========================
export const getAllFaq = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(`SELECT * FROM faq ORDER BY id DESC`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching faq:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL Active faq ===========================
export const getAllActiveFaq = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(`SELECT * FROM faq WHERE status = 'active' ORDER BY sort_order`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching faq:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET faq by ID ===========================
export const getFaqById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM faq WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Faq not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching Slider:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= UPDATE faq ===========================
export const updateFaq = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await pool.query(`SELECT * FROM faq WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: "faq not found" });

    // Dynamically build the update query
    const fields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(", ");
    const values = Object.keys(updates).map(key => updates[key] ?? existing[0][key]);
    values.push(id);

    const query = `UPDATE faq SET ${fields} WHERE id = ?`;
    await pool.query(query, values);

    res.status(200).json({ message: "Faq updated successfully"});
  } catch (err) {
    console.error("Error updating Faq:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= DELETE Faq ===========================
export const deleteFaq = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [existing] = await pool.query(`SELECT * FROM faq WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: "Faq not found" });

    await pool.query(`DELETE FROM faq WHERE id = ?`, [id]);
    res.status(200).json({ message: "faq deleted successfully" });
  } catch (err) {
    console.error("Error deleting faq:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
