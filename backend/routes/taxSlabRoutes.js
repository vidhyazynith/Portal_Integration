import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  createTaxSlab,
  getTaxSlabs,
  getTaxSlabById,
  updateTaxSlab,
  deleteTaxSlab,
} from "../Controllers/taxSlabController.js";

const router = express.Router();

router.post("/",  authenticateToken, requireRole('admin'), createTaxSlab);
router.get("/",  authenticateToken, requireRole('admin'), getTaxSlabs);
router.get("/:id",  authenticateToken, requireRole('admin'), getTaxSlabById);
router.put("/:id",  authenticateToken, requireRole('admin'), updateTaxSlab);
router.delete("/:id",  authenticateToken, requireRole('admin'), deleteTaxSlab);

export default router;