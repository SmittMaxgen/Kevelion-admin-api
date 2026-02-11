import { Router } from "express";
import {
  createBuyer,
  updateBuyer,
  getAllBuyers,
  getAllPendingBuyers,
  deleteBuyer,
  getBuyerById,
  getAllCompany,
  getAllCompanyByBuyer,
  getAllCompanyById,
  getBuyerByMobile,
} from "../../controllers/buyerController/buyerController.js";
import { upload } from "../../middlewares/upload.js";

const router = Router();

const buyerUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "aadhar_front", maxCount: 1 },
  { name: "aadhar_back", maxCount: 1 },
  { name: "driving_license_front", maxCount: 1 },
  { name: "driving_license_back", maxCount: 1 },
]);

const handleFileUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    buyerUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      next();
    });
  } else {
    next();
  }
};



// Routes
router.post("/buyer",handleFileUpload, createBuyer);

router.get("/buyers", getAllBuyers);

router.get("/company", getAllCompany);

router.get("/buyers/pending", getAllPendingBuyers);

router.get("/buyer/:id", getBuyerById);

router.get("/buyer/mobile/:mobile", getBuyerByMobile);



router.patch("/buyer/:id",handleFileUpload ,updateBuyer);

router.delete("/buyer/:id", deleteBuyer);
//company 

router.get("/company", getAllCompany);

router.get("/company/buyer/:buyer_id", getAllCompanyByBuyer);

router.get("/company/:id", getAllCompanyById);

export default router
