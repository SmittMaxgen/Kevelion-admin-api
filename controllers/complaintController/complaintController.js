import { connectDB } from "../../connection/db.js";

// ======================= CREATE COMPLAINT =======================
export const createComplaint = async (req, res) => {
  try {
    const { order_product_id, complaint } = req.body;

    if (!order_product_id || !complaint) {
      return res.status(400).json({
        success: false,
        message: "order_product_id and complaint are required",
      });
    }

    const db = await connectDB();

    const [result] = await db.execute(
      `INSERT INTO order_complaint (order_product_id, complaint)
       VALUES (?, ?)`,
      [order_product_id, complaint],
    );

    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaint_id: result.insertId,
    });
  } catch (error) {
    console.error("Create Complaint Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= GET ALL COMPLAINTS =======================
export const getAllComplaints = async (req, res) => {
  try {
    const db = await connectDB();

    const [rows] = await db.execute(`
      SELECT 
        oc.id,
        oc.order_product_id,
        oc.complaint,
        oc.status,
        oc.admin_reply,
        oc.seller_reply,
        oc.created_at,
        oc.updated_at,

        op.seller_id,
        s.name AS seller_name,

        o.buyer_id,
        b.name AS buyer_name

      FROM order_complaint oc

      LEFT JOIN order_products op 
        ON oc.order_product_id = op.id

      LEFT JOIN orders o 
        ON op.order_id = o.id

      LEFT JOIN seller s 
        ON op.seller_id = s.id

      LEFT JOIN buyer b 
        ON o.buyer_id = b.id

      ORDER BY oc.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get All Complaints Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================= GET BY SELLER =======================
export const getComplaintsBySeller = async (req, res) => {
  try {
    const { seller_id } = req.params;
    const db = await connectDB();

    const [rows] = await db.execute(
      `
      SELECT 
        oc.*,
        o.buyer_id,
        b.name AS buyer_name
      FROM order_complaint oc
      JOIN order_products op ON oc.order_product_id = op.id
      JOIN orders o ON op.order_id = o.id
      LEFT JOIN buyer b ON o.buyer_id = b.id
      WHERE op.seller_id = ?
      ORDER BY oc.created_at DESC
      `,
      [seller_id],
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get Seller Complaints Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= GET BY BUYER =======================
export const getComplaintsByBuyer = async (req, res) => {
  try {
    const { buyer_id } = req.params;
    const db = await connectDB();

    const [rows] = await db.execute(
      `
      SELECT 
        oc.*,
        op.seller_id,
        s.name AS seller_name
      FROM order_complaint oc
      JOIN order_products op ON oc.order_product_id = op.id
      JOIN orders o ON op.order_id = o.id
      LEFT JOIN seller s ON op.seller_id = s.id
      WHERE o.buyer_id = ?
      ORDER BY oc.created_at DESC
      `,
      [buyer_id],
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get Buyer Complaints Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= UPDATE (ADMIN) =======================
export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply, seller_reply } = req.body;

    const db = await connectDB();

    await db.execute(
      `UPDATE order_complaint
       SET 
         status = COALESCE(?, status),
         admin_reply = COALESCE(?, admin_reply),
         seller_reply = COALESCE(?, seller_reply)
       WHERE id = ?`,
      [status, admin_reply, seller_reply, id],
    );

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
    });
  } catch (error) {
    console.error("Update Complaint Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= SELLER REPLY ONLY =======================
export const sellerReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { seller_reply } = req.body;

    if (!seller_reply) {
      return res.status(400).json({
        success: false,
        message: "seller_reply is required",
      });
    }

    const db = await connectDB();

    await db.execute(
      `UPDATE order_complaint
       SET seller_reply = ?
       WHERE id = ?`,
      [seller_reply, id],
    );

    res.status(200).json({
      success: true,
      message: "Seller replied successfully",
    });
  } catch (error) {
    console.error("Seller Reply Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= DELETE =======================
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectDB();

    await db.execute(`DELETE FROM order_complaint WHERE id = ?`, [id]);

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    console.error("Delete Complaint Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
