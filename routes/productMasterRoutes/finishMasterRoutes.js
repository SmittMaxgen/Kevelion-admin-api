import { Router } from "express";
import {
  createFinish,
  getAllFinish,
  getAllActiveFinish,
  getFinishById,
  updateFinish,
  deleteFinish,
} from "../../controllers/productMasterController/finishMasterController.js";

const router = Router();

router.post("/finish", createFinish);
router.patch("/finish/:id", updateFinish);
router.get("/finishes", getAllFinish);
router.get("/finishes/active", getAllActiveFinish);
router.get("/finish/:id", getFinishById);
router.delete("/finish/:id", deleteFinish);

export default router;
