import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  createTaxRegime,
  getTaxRegimes,
  updateTaxRegime,
  deleteTaxRegime
} from "../controllers/taxRegimeController.js";

const router = express.Router();

router.post("/",  authenticateToken, requireRole('admin'), createTaxRegime);
router.get("/", getTaxRegimes);
router.put("/:id",  authenticateToken, requireRole('admin'), updateTaxRegime);
router.delete("/:id",  authenticateToken, requireRole('admin'), deleteTaxRegime);

export default router; 