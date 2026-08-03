import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  assignEmployeeRegime,
  getEmployeeRegimes,
  updateEmployeeRegime,
  deleteEmployeeRegime,
} from "../Controllers/employeeTaxRegimeController.js";

const router = express.Router();

router.post("/", assignEmployeeRegime);
router.get("/", getEmployeeRegimes);
router.put("/:id", updateEmployeeRegime);
router.delete("/:id", deleteEmployeeRegime);

export default router;