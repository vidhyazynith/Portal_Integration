import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  createDeductionLimit,
  getDeductionLimits,
  updateDeductionLimit,
  deleteDeductionLimit,
} from "../Controllers/deductionLimitController.js";

const router = express.Router();

router.post("/", authenticateToken, requireRole('admin'),createDeductionLimit);
router.get("/", getDeductionLimits);
router.put("/:id", authenticateToken, requireRole('admin'), updateDeductionLimit);
router.delete("/:id", authenticateToken, requireRole('admin'), deleteDeductionLimit);

export default router; 