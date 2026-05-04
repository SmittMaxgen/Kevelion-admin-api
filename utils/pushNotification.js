// ==============================
// utils/pushNotification.js
// ==============================
import admin from "./firebase.js";
import { connectDB } from "../connection/db.js";

// Send push by user id
export const sendPushToUser = async (userId, title, body, data = {}) => {
  try {
    const pool = await connectDB();

    const [rows] = await pool.query(
      `SELECT fcm_token FROM buyer WHERE id = ? LIMIT 1`,
      [userId],
    );
    console.log("rows:::>>>>", rows);

    if (!rows.length || !rows[0].fcm_token) {
      console.log("No token found for user:", userId);
      return false;
    }

    const token = rows[0].fcm_token;

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ),
    };

    const response = await admin.messaging().send(message);

    console.log("Push sent:", response);
    return true;
  } catch (error) {
    console.error("Push Error:", error.message);
    return false;
  }
};
