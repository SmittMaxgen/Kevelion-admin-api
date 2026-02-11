import { connectDB } from "../../connection/db.js";

// ======================= CREATE slider ===========================
export const createSlider = async (req, res) => {
  try {
    const pool = await connectDB();
    const {
      banner_image,
      tag_line,
      CTA_button,
      CTA_button_link,
      sort_order,
      status = "inactive",
    } = req.body;

    const bannerImage = req.files?.["banner_image"]?.[0]
      ? `/uploads/${req.files["banner_image"][0].filename}`
      : "";
    const [result] = await pool.query(
      `INSERT INTO banner
        (banner_image,tag_line, CTA_button, CTA_button_link,sort_order, status)
       VALUES (?, ?, ?, ?, ?,? )`,
      [bannerImage, tag_line, CTA_button, CTA_button_link, sort_order, status],
    );

    res
      .status(201)
      .json({ message: "Slider created", banner_id: result.insertId });
  } catch (err) {
    console.error("Error creating slider:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL Slider ===========================
export const getAllSlider = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(`SELECT * FROM banner ORDER BY id DESC`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching Slider:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL Active Slider ===========================
export const getAllActiveSlider = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT * FROM banner WHERE status = 'active' ORDER BY sort_order`,
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching Slider:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET slider by ID ===========================
export const getSliderById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM banner WHERE id = ?`, [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Slider not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching Slider:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= UPDATE Slider ===========================
export const updateSlider = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await pool.query(`SELECT * FROM banner WHERE id = ?`, [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Slider not found" });

    const bannerImage = req.files?.["banner_image"]?.[0]
      ? `/uploads/${req.files["banner_image"][0].filename}`
      : "";

    // ⭐ If new image uploaded, add to updates
    if (bannerImage) {
      updates.banner_image = bannerImage;
    }

    // Dynamically build the update query
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.keys(updates).map(
      (key) => updates[key] ?? existing[0][key],
    );
    values.push(id);

    const query = `UPDATE banner SET ${fields} WHERE id = ?`;
    await pool.query(query, values);

    res
      .status(200)
      .json({ message: "Slider updated successfully", data: query });
  } catch (err) {
    console.error("Error updating Slider:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= DELETE Slider ===========================
export const deleteSlider = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [existing] = await pool.query(`SELECT * FROM banner WHERE id = ?`, [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Slider not found" });

    await pool.query(`DELETE FROM banner WHERE id = ?`, [id]);
    res.status(200).json({ message: "Slider deleted successfully" });
  } catch (err) {
    console.error("Error deleting Slider:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
