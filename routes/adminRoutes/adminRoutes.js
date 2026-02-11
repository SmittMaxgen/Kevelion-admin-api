import { Router } from "express";
import {
  createAdmin,
  sendAllAdmins,
  sendDataById,
  updateAdmin,
  deleteAdmin,
} from "../../controllers/adminController/adminController.js";
import { upload } from "../../middlewares/upload.js";

const router = Router();

// Accept multiple files for buyer
const adminUpload = upload.fields([
  { name: "image", maxCount: 1 },                 // Profile photo
]);

// Routes
router.post(
  "/admin",
  (req, res, next) => {
    // If content type is multipart -> use multer
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      adminUpload(req, res, function (err) {
        if (err) {
          return res
            .status(400)
            .json({ message: "File upload error", error: err });
        }
        next();
      });
    } else {
      // For JSON requests, just continue
      next();
    }
  },
  createAdmin
);



router.patch(
  "/admin/:id",
  (req, res, next) => {
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      adminUpload(req, res, function (err) {
        if (err) {
          return res
            .status(400)
            .json({ message: "File upload error", error: err });
        }
        next();
      });
    } else {
      next();
    }
  },
  updateAdmin
);

router.get("/admins", sendAllAdmins);

router.get("/admin/:id", sendDataById);

router.delete("/admin/:id", deleteAdmin);

export default router
 