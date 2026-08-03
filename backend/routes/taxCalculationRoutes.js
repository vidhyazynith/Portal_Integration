import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  calculateTax
} from "../Controllers/taxCalculationController.js";

const router =
  express.Router();

router.get(
  "/employee/:employeeId/financial-year/:financialYearId", authenticateToken, requireRole('admin'),
  calculateTax
);

export default router;