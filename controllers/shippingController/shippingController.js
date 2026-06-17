import { connectDB } from "../../connection/db.js";

// ========================= CREATE SHIPPING ENTRIES =========================
export const createShippingEntries = async (req, res) => {
  let conn;
  try {
    const { order_id, buyer_id } = req.body;
    if (!order_id || !buyer_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "order_id and buyer_id are required",
        });
    }

    const pool = await connectDB();
    conn = await pool.getConnection();

    const [sellers] = await conn.query(
      `SELECT DISTINCT seller_id FROM order_products WHERE order_id = ?`,
      [order_id],
    );

    if (!sellers.length) {
      return res
        .status(404)
        .json({ success: false, message: "No sellers found for this order" });
    }

    const shippingIds = [];
    for (const seller of sellers) {
      const [result] = await conn.query(
        `INSERT INTO shipping 
         (order_id, buyer_id, seller_id, shipping_status)
         VALUES (?, ?, ?, 'Pending')`,
        [order_id, buyer_id, seller.seller_id],
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
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ========================= UPDATE SHIPPING =========================
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

    let cost = shipping_cost;
    if (!shipping_cost && total_weight > 0) {
      cost =
        delivery_type === "Express" ? total_weight * 80 : total_weight * 40;
    }

    const [result] = await conn.query(
      `UPDATE shipping 
       SET courier_name=?, courier_company_name=?, courier_mobile=?, tracking_number=?,
           shipping_address=?, delivery_type=?, total_weight=?, shipping_cost=?,
           shipping_status=?, remarks=?, estimated_delivery_date=?, actual_delivery_date=?
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
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Shipping record not found" });
    }

    res.json({ success: true, message: "Shipping updated successfully" });
  } catch (err) {
    console.error("Error updating shipping:", err);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
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
      return res
        .status(400)
        .json({ success: false, message: "order_id is required" });
    }

    const pool = await connectDB();
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      `SELECT s.*, sel.name AS seller_name
       FROM shipping s
       LEFT JOIN seller sel ON s.seller_id = sel.id
       WHERE s.order_id = ?`,
      [order_id],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "No shipping records found" });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching shipping:", err);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ========================= SHIPMENT SETTINGS =========================

// POST /shipment-settings — Admin create or update
export const createOrUpdateShipmentSettings = async (req, res) => {
  let conn;
  try {
    const { shipment_min_cost, shipment_cost } = req.body;

    if (shipment_min_cost == null || shipment_cost == null) {
      return res.status(400).json({
        success: false,
        message: "Both shipment_min_cost and shipment_cost are required.",
      });
    }

    if (Number(shipment_min_cost) < 0 || Number(shipment_cost) < 0) {
      return res.status(400).json({
        success: false,
        message: "Values cannot be negative.",
      });
    }

    const pool = await connectDB(); // ✅ call connectDB() to get the pool
    conn = await pool.getConnection(); // ✅ get a connection from the pool

    const [existing] = await conn.query(
      "SELECT id FROM shipment_settings WHERE is_active = 1 LIMIT 1",
    );

    if (existing.length > 0) {
      await conn.query(
        `UPDATE shipment_settings
         SET shipment_min_cost = ?, shipment_cost = ?, updated_at = NOW()
         WHERE is_active = 1`,
        [shipment_min_cost, shipment_cost],
      );

      return res.status(200).json({
        success: true,
        message: "Shipment settings updated successfully.",
        data: { shipment_min_cost, shipment_cost },
      });
    } else {
      await conn.query(
        `INSERT INTO shipment_settings (shipment_min_cost, shipment_cost, is_active)
         VALUES (?, ?, 1)`,
        [shipment_min_cost, shipment_cost],
      );

      return res.status(201).json({
        success: true,
        message: "Shipment settings created successfully.",
        data: { shipment_min_cost, shipment_cost },
      });
    }
  } catch (error) {
    console.error("createOrUpdateShipmentSettings error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    if (conn) conn.release(); // ✅ always release
  }
};

// GET /shipment-settings — Admin fetch current config
export const getShipmentSettings = async (req, res) => {
  let conn;
  try {
    const pool = await connectDB();
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      "SELECT * FROM shipment_settings WHERE is_active = 1 LIMIT 1",
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No shipment settings found. Please configure them.",
      });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("getShipmentSettings error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    if (conn) conn.release();
  }
};

// UTILITY — used internally in order creation (not a route handler)
// const { shipment_charge, final_price } = await calculateShipmentCharge(3000);
export const calculateShipmentCharge = async (order_amount) => {
  let conn;
  try {
    const pool = await connectDB();
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      "SELECT shipment_min_cost, shipment_cost FROM shipment_settings WHERE is_active = 1 LIMIT 1",
    );

    if (rows.length === 0) {
      return {
        shipment_charge: 0,
        final_price: Number(order_amount),
        note: "No shipment settings configured. No charge applied.",
      };
    }

    const { shipment_min_cost, shipment_cost } = rows[0];
    const amount = Number(order_amount);

    const shipment_charge =
      amount >= Number(shipment_min_cost) ? 0 : Number(shipment_cost);
    const final_price = amount + shipment_charge;

    return {
      shipment_charge,
      final_price,
      shipment_min_cost: Number(shipment_min_cost),
      shipment_cost: Number(shipment_cost),
    };
  } finally {
    if (conn) conn.release();
  }
};

// POST /shipment-settings/calculate — Preview charge for order amount
export const calculateShipmentChargeAPI = async (req, res) => {
  try {
    const { order_amount } = req.body;

    if (order_amount == null || isNaN(order_amount)) {
      return res.status(400).json({
        success: false,
        message: "order_amount is required and must be a number.",
      });
    }

    if (Number(order_amount) < 0) {
      return res.status(400).json({
        success: false,
        message: "order_amount cannot be negative.",
      });
    }

    const result = await calculateShipmentCharge(order_amount);

    return res.status(200).json({
      success: true,
      data: {
        order_amount: Number(order_amount),
        ...result,
      },
    });
  } catch (error) {
    console.error("calculateShipmentChargeAPI error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
