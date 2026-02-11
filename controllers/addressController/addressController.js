import { connectDB } from "../../connection/db.js";

// ======================= CREATE Address ===========================
export const createAddress = async (req, res) => {
  try {
    const pool = await connectDB();
    const {
        buyer_id,
      label,
      address_line1,
      address_line2,
      landmark,
      area,
      city,
      state,
      country,
      pincode,
      address_type,
      is_default,
      contact_name,
      contact_phone,
      latitude,
      longitude,
      
      
    } = req.body;

      const [result] = await pool.query(
      `INSERT INTO address
        (buyer_id,label,address_line1, address_line2, landmark,area, city,state,country,pincode,address_type,is_default,contact_name,contact_phone,latitude,longitude)
       VALUES (?,?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,? )`,
      [
          buyer_id,
          label,
          address_line1,
          address_line2,
          landmark,
          area,
          city,
          state,
          country,
          pincode,
          address_type,
          is_default,
          contact_name,
          contact_phone,
          latitude,
          longitude,
      ]
    );

    res.status(201).json({ message: "Address created", address_id: result.insertId });
  } catch (err) {
    console.error("Error creating Address:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL Address BY Buyer ===========================
export const getAllAddressByByer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;
    
    const [rows] = await pool.query(`SELECT * FROM address WHERE buyer_id = ? ORDER BY id DESC`,[buyer_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching Address:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL Address  ===========================
export const getAllAddress = async (req, res) => {
  try {
    const pool = await connectDB();
    
    const [rows] = await pool.query(`SELECT * FROM address ORDER BY id DESC`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching Address:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET address by ID ===========================
export const getAddressById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM address WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Address not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching Address:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= UPDATE address ===========================
export const updateAddress = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await pool.query(`SELECT * FROM address WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: "Address not found" });

     
    // Dynamically build the update query
    const fields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(", ");
    const values = Object.keys(updates).map(key => updates[key] ?? existing[0][key]);
    values.push(id);

    const query = `UPDATE address SET ${fields} WHERE id = ?`;
    await pool.query(query, values);

    res.status(200).json({ message: "Address updated successfully" , data : query });
  } catch (err) {
    console.error("Error updating Address:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ======================= DELETE address ===========================
export const deleteAddress = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [existing] = await pool.query(`SELECT * FROM address WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: "Address not found" });

    await pool.query(`DELETE FROM address WHERE id = ?`, [id]);
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error("Error deleting Address:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
