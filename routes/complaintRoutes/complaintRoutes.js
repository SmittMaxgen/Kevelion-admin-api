import express from "express";
import {
  createComplaint,
  getAllComplaints,
  getComplaintsBySeller,
  getComplaintsByBuyer,
  updateComplaint,
  deleteComplaint,
} from "../../controllers/complaintController/complaintController.js";

const router = express.Router();

router.post("/complaint", createComplaint);
router.get("/complaint", getAllComplaints);
router.get("/complaint/seller/:seller_id", getComplaintsBySeller);
router.get("/complaint/buyer/:buyer_id", getComplaintsByBuyer);
router.patch("/complaint/:id", updateComplaint);
router.delete("/complaint/:id", deleteComplaint);

export default router;
