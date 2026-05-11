// // ==============================
// // utils/orderNotification.js
// // ==============================
// import { sendPushToUser } from "./pushNotification.js";

// export const sendOrderStatusNotification = async (buyerId, orderId, status) => {
//   const messages = {
//     New: {
//       title: "Order Placed",
//       body: `Your order #${orderId} has been placed.`,
//     },
//     Processing: {
//       title: "Order Processing",
//       body: `Your order #${orderId} is being processed.`,
//     },
//     Confirmed: {
//       title: "Order Confirmed",
//       body: `Your order #${orderId} has been confirmed.`,
//     },
//     Shipped: {
//       title: "Order Shipped",
//       body: `Your order #${orderId} has been shipped.`,
//     },
//     "Out for Delivery": {
//       title: "Out for Delivery",
//       body: `Your order #${orderId} is out for delivery.`,
//     },
//     Delivered: {
//       title: "Order Delivered",
//       body: `Your order #${orderId} has been delivered.`,
//     },
//     Cancelled: {
//       title: "Order Cancelled",
//       body: `Your order #${orderId} has been cancelled.`,
//     },
//   };
//   console.log("buyerId, orderId, status====>>>>>", buyerId, orderId, status);
//   const msg = messages[status];
//   console.log("msg====>>>", msg);
//   if (!msg) return;

//   await sendPushToUser(buyerId, msg.title, msg.body, {
//     order_id: orderId,
//     status,
//     type: "order",
//   });
// };

// =======================================
// utils/orderNotification.js
// =======================================
import { sendPushToUser } from "./pushNotification.js";
import { createNotification } from "../controllers/notificationController/notificationController.js";
import { connectDB } from "../connection/db.js";

export const sendOrderStatusNotification = async (
  buyerId,
  orderId,
  status,
  productId = null,
) => {
  try {
    const pool = await connectDB();

    const [rows] = await pool.query(
      `SELECT fcm_token FROM buyer WHERE id = ? LIMIT 1`,
      [buyerId],
    );

    const token = rows.length > 0 ? rows[0].fcm_token : null;

    // Fetch product name if productId provided
    let productLabel = "";
    if (productId) {
      const [prodRows] = await pool.query(
        `SELECT name FROM product WHERE id = ? LIMIT 1`,
        [productId],
      );
      if (prodRows.length > 0) {
        productLabel = ` (${prodRows[0].name})`;
      }
    }

    const messages = {
      New: {
        title: "Order Placed",
        body: `Your order #${orderId}${productLabel} has been placed.`,
      },
      Processing: {
        title: "Processing",
        body: `Your order #${orderId}${productLabel} is processing.`,
      },
      Confirmed: {
        title: "Confirmed",
        body: `Your order #${orderId}${productLabel} is confirmed.`,
      },
      Shipped: {
        title: "Shipped",
        body: `Your order #${orderId}${productLabel} has been shipped.`,
      },
      "Out for Delivery": {
        title: "Out for Delivery",
        body: `Your order #${orderId}${productLabel} is out for delivery.`,
      },
      Delivered: {
        title: "Delivered",
        body: `Your order #${orderId}${productLabel} has been delivered.`,
      },
      Cancelled: {
        title: "Cancelled",
        body: `Your order #${orderId}${productLabel} has been cancelled.`,
      },
    };

    const data = messages[status] || messages["New"];

    // Save DB Notification
    // await createNotification(buyerId, orderId, data.title, data.body, status);

    const notificationId = await createNotification(
      buyerId,
      orderId,
      data.title,
      data.body,
      status,
    );

    // Push Notification
    if (token) {
      await sendPushToUser(buyerId, data.title, data.body, {
        // type: "order",
        // order_id: String(orderId),
        // status,
        type: "order",
        order_id: String(orderId),
        status,
        notification_id: String(notificationId),
        ...(productId && { product_id: String(productId) }),
      });
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
