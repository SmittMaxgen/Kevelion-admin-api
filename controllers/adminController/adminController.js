import { connectDB } from "../../connection/db.js";
import bcrypt from "bcrypt";

// ======================= CREATE ADMIN ===========================
export const createAdmin = async (req, res) => {
  try {
    const pool = await connectDB();

    const { name, mobile, email, password, status = "Inactive", device_token } = req.body;

    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if email or mobile already exists
    const [existing] = await pool.query(
      "SELECT * FROM admins WHERE email = ? OR mobile = ?",
      [email, mobile]
    );

    if (existing.length > 0) {
      const existsField = existing[0].email === email ? "Email" : "Mobile number";
      return res.status(400).json({ message: `${existsField} already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = req.files?.["image"]?.[0] ? `/uploads/${req.files["image"][0].filename}` : "";

    const [result] = await pool.query(
      `INSERT INTO admins (name, mobile, email, password, image, status, device_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, mobile, email, hashedPassword, profileImage, status, device_token]
    );

    res.status(201).json({
      message: "Admin created successfully",
      adminId: result.insertId,
    });
  } catch (err) {
    console.error("Error creating Admin:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= UPDATE ADMIN ===========================
export const updateAdmin = async (req, res) => {
  try {
    const pool = await connectDB();
    const adminId = req.params.id;
    const { name, mobile, email, password, status, device_token } = req.body;

    const [adminRows] = await pool.query("SELECT * FROM admins WHERE id = ?", [adminId]);
    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if email is being updated and already exists
    if (email && email !== adminRows[0].email) {
      const [emailRows] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);
      if (emailRows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const newPassword = password ? await bcrypt.hash(password, 10) : adminRows[0].password;
    const imagePath = req.files?.["image"]?.[0] ? `/uploads/${req.files["image"][0].filename}` : adminRows[0].image;

    await pool.query(
      `UPDATE admins
       SET name = ?, mobile = ?, email = ?, password = ?, status = ?, device_token = ?, image = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, mobile, email, newPassword, status, device_token, imagePath, adminId]
    );

    res.status(200).json({ message: "Admin updated successfully" });
  } catch (err) {
    console.error("Error updating Admin:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL ADMINS ===========================
export const sendAllAdmins = async (req, res) => {
  try {
    const pool = await connectDB();
    const [admins] = await pool.query(
      "SELECT id, name, mobile, email, image, status, device_token, created_at, updated_at FROM admins ORDER BY id DESC"
    );
    res.status(200).json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= DELETE ADMIN ===========================
export const deleteAdmin = async (req, res) => {
  try {
    const pool = await connectDB();
    const adminId = req.params.id;

    const [rows] = await pool.query("SELECT * FROM admins WHERE id = ?", [adminId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await pool.query("DELETE FROM admins WHERE id = ?", [adminId]);
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Error deleting Admin:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ADMIN BY ID ===========================
export const sendDataById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM admins WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];
    delete admin.password; // don't send password
    res.status(200).json(admin);
  } catch (err) {
    console.error("Error fetching Admin by ID:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
