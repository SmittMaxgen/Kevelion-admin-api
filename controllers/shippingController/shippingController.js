import { connectDB } from "../../connection/db.js";

// ========================= CREATE SHIPPING ENTRIES =========================
// Creates one shipping entry per seller for a given order
export const createShippingEntries = async (req, res) => {
  let conn;
  try {
    const { order_id, buyer_id } = req.body;
    if (!order_id || !buyer_id) {
      return res.status(400).json({ success: false, message: "order_id and buyer_id are required" });
    }

    const pool = await connectDB();
    conn = await pool.getConnection();

    // 1. Get distinct sellers from order_items table
    const [sellers] = await conn.query(
      `SELECT DISTINCT seller_id FROM order_products WHERE order_id = ?`,
      [order_id]
    );

    if (!sellers.length) {
      return res.status(404).json({ success: false, message: "No sellers found for this order" });
    }


    // 2. Create shipping record for each seller
    const shippingIds = [];
    
    for (const seller of sellers) {
      const [result] = await conn.query(
        `INSERT INTO shipping 
         (order_id, buyer_id, seller_id, shipping_status)
         VALUES (?, ?, ?, 'Pending')`,
        [order_id, buyer_id, seller.seller_id]
      );
      shippingIds.push(result.insertId);
    }

    res.json({
      success: true,
      message: "Shipping records created for all sellers",
      shipping_ids: shippingIds,
    });
  } catch (err) {
    console.error("Error creating shipping entries:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ========================= UPDATE SHIPPING =========================
// Seller updates their shipping details (tracking, courier, cost, etc.)
export const updateShippingBySeller = async (req, res) => {
  let conn;
  try {
    const { order_id, seller_id } = req.params;
    const {
      courier_name,
      courier_company_name,
      courier_mobile,
      tracking_number,
      shipping_address,
      delivery_type = "Standard",
      total_weight = 0,
      shipping_cost = 0,
      shipping_status,
      remarks,
      estimated_delivery_date,
      actual_delivery_date,
    } = req.body;

    const pool = await connectDB();
    conn = await pool.getConnection();

    // Optional: auto-calculate cost if not provided
    let cost = shipping_cost;
    if (!shipping_cost && total_weight > 0) {
      cost = delivery_type === "Express" ? total_weight * 80 : total_weight * 40;
    }

    const [result] = await conn.query(
      `UPDATE shipping 
       SET courier_name=?, courier_company_name=?,courier_mobile=?, tracking_number=?,shipping_address=?, delivery_type=?, total_weight=?, shipping_cost=?, shipping_status=?, remarks=?, estimated_delivery_date=?, 
           actual_delivery_date=?
       WHERE order_id=? AND seller_id=?`,
      [
        courier_name,
        courier_company_name,
        courier_mobile,
        tracking_number,
        shipping_address,
        delivery_type,
        total_weight,
        cost,
        shipping_status,
        remarks,
        estimated_delivery_date,
        actual_delivery_date,
        order_id,
        seller_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Shipping record not found" });
    }

    res.json({ success: true, message: "Shipping updated successfully" });
  } catch (err) {
    console.error("Error updating shipping:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ========================= GET SHIPPING BY ORDER =========================
export const getShippingByOrder = async (req, res) => {
  let conn;
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ success: false, message: "order_id is required" });
    }

    const pool = await connectDB();
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      `SELECT s.*, sel.name AS seller_name
       FROM shipping s
       LEFT JOIN seller sel ON s.seller_id = sel.id
       WHERE s.order_id = ?`,
      [order_id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "No shipping records found" });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching shipping:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};
