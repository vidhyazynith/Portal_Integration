import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  createFinancialYear,
  getFinancialYears,
  getFinancialYearById,
  updateFinancialYear,
  deleteFinancialYear,
  getActiveFinancialYear
} from "../controllers/financialYearController.js";

const router = express.Router();

router.post("/",  authenticateToken, requireRole('admin'), createFinancialYear);
router.get("/",  authenticateToken, requireRole('admin'), getFinancialYears);
router.get("/active",getActiveFinancialYear);
router.get("/:id",  authenticateToken, requireRole('admin'), getFinancialYearById);
router.put("/:id",  authenticateToken, requireRole('admin'), updateFinancialYear);
router.delete("/:id",  authenticateToken, requireRole('admin'), deleteFinancialYear);

export default router;