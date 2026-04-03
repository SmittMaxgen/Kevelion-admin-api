import { connectDB } from "../../connection/db.js";

// ======================= CREATE Contact ===========================
// SMTP : xsmtpsib-3340c3594ec90fa6281dca835be31b7e9cd7671eae3789d36acfe4b3c7778117-wBz6sFrFkjna0x6W
// API KEY = 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

// export const createContact = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { buyer_id, name, email, mobile } = req.body;

//     const [result] = await pool.query(
//       `INSERT INTO contacts (buyer_id, name, email, mobile) VALUES (?, ?, ?, ?)`,
//       [buyer_id, name, email, mobile],
//     );

//     res
//       .status(201)
//       .json({ message: "Contact created", contact_id: result.insertId });
//   } catch (err) {
//     console.error("Error creating Contact:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
import * as Brevo from "@getbrevo/brevo";

export const createContact = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id, name, email, mobile } = req.body;

    const [result] = await pool.query(
      `INSERT INTO contacts (buyer_id, name, email, mobile) VALUES (?, ?, ?, ?)`,
      [buyer_id, name, email, mobile],
    );

    try {
      const client = new Brevo.TransactionalEmailsApi();
      client.authentications["api-key"].apiKey =
        "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";

      await client.sendTransacEmail({
        sender: {
          email: "kevelion@gmail.com",
          name: "Kevelion",
        },
        to: [{ email: email, name: name }],
        subject: "Contact Added Successfully",
        htmlContent: `
          <h2>Hi ${name}!</h2>
          <p>Your contact has been created successfully.</p>
          <p><strong>Mobile:</strong> ${mobile}</p>
        `,
      });
    } catch (mailErr) {
      console.error("Email failed:", mailErr.message);
    }

    res
      .status(201)
      .json({ message: "Contact created", contact_id: result.insertId });
  } catch (err) {
    console.error("Error creating Contact:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL Contacts BY Buyer ===========================
export const getAllContactsByBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM contacts WHERE buyer_id = ? ORDER BY id DESC`,
      [buyer_id],
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching Contacts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL Contacts ===========================
export const getAllContacts = async (req, res) => {
  try {
    const pool = await connectDB();

    const [rows] = await pool.query(`SELECT * FROM contacts ORDER BY id DESC`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching Contacts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET Contact BY ID ===========================
export const getContactById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM contacts WHERE id = ?`, [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Contact not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching Contact:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= UPDATE Contact ===========================
export const updateContact = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await pool.query(`SELECT * FROM contacts WHERE id = ?`, [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Contact not found" });

    // Dynamically build the update query
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.keys(updates).map(
      (key) => updates[key] ?? existing[0][key],
    );
    values.push(id);

    const query = `UPDATE contacts SET ${fields} WHERE id = ?`;
    await pool.query(query, values);

    res
      .status(200)
      .json({ message: "Contact updated successfully", data: query });
  } catch (err) {
    console.error("Error updating Contact:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= DELETE Contact ===========================
export const deleteContact = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [existing] = await pool.query(`SELECT * FROM contacts WHERE id = ?`, [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Contact not found" });

    await pool.query(`DELETE FROM contacts WHERE id = ?`, [id]);
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error("Error deleting Contact:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
