// =======================================
// routes/notificationRoutes.js
// =======================================
import express from "express";

import {
  getBuyerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../../controllers/notificationController/notificationController.js";

const router = express.Router();

router.get("/notifications/:buyer_id", getBuyerNotifications);

router.put("/notifications/read/:id", markNotificationRead);

router.put("/notifications/:buyer_id", markAllNotificationsRead);

router.delete("/notification/:id", deleteNotification);

export default router;
