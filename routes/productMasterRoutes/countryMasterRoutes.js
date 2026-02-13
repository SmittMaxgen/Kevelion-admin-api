import { Router } from "express";
import {
  createCountry,
  getAllCountry,
  getAllActiveCountry,
  getCountryById,
  updateCountry,
  deleteCountry,
} from "../../controllers/productMasterController/countryMasterController.js";

const router = Router();

router.post("/country", createCountry);
router.patch("/country/:id", updateCountry);
router.get("/countries", getAllCountry);
router.get("/countries/active", getAllActiveCountry);
router.get("/country/:id", getCountryById);
router.delete("/country/:id", deleteCountry);

export default router;
