// =======================================
// controllers/notificationController.js
// =======================================
import { connectDB } from "../../connection/db.js";

// CREATE NOTIFICATION
export const createNotification = async (
  buyer_id,
  order_id,
  title,
  message,
  status = null,
) => {
  try {
    const pool = await connectDB();

    await pool.query(
      `INSERT INTO notifications
      (buyer_id, order_id, type, title, message, status)
      VALUES (?, ?, 'order', ?, ?, ?)`,
      [buyer_id, order_id, title, message, status],
    );

    return true;
  } catch (error) {
    console.error("Create Notification Error:", error);
    return false;
  }
};

// GET ALL NOTIFICATIONS BY BUYER
export const getBuyerNotifications = async (req, res) => {
  try {
    const { buyer_id } = req.params;

    const pool = await connectDB();

    const [rows] = await pool.query(
      `SELECT *
         FROM notifications
         WHERE buyer_id = ?
         ORDER BY id DESC`,
      [buyer_id],
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// MARK SINGLE READ
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await connectDB();

    await pool.query(
      `UPDATE notifications
         SET is_read = 1
         WHERE id = ?`,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// MARK ALL READ
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { buyer_id } = req.params;

    const pool = await connectDB();

    await pool.query(
      `UPDATE notifications
         SET is_read = 1
         WHERE buyer_id = ?`,
      [buyer_id],
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE SINGLE
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await connectDB();

    await pool.query(
      `DELETE FROM notifications
         WHERE id = ?`,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
