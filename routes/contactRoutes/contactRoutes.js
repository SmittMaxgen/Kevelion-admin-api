import express from "express";
import {
  createContact,
  getAllContactsByBuyer,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
} from "../../controllers/contactsController/contactsController.js";

const router = express.Router();

router.post("/contact", createContact);
router.get("/contact", getAllContacts);
router.get("/contact/buyer/:buyer_id", getAllContactsByBuyer);
router.get("/contact/:id", getContactById);
router.put("/contact/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
