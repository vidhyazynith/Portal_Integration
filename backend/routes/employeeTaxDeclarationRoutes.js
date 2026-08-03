import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  createEmployeeTaxDeclaration,
  getEmployeeTaxDeclarations,
  getEmployeeTaxDeclarationById,
  getEmployeeDeclaration,
  updateEmployeeTaxDeclaration,
  deleteEmployeeTaxDeclaration,
} from "../controllers/employeeTaxDeclarationController.js";

const router = express.Router();

router.post("/", createEmployeeTaxDeclaration);

router.get("/", getEmployeeTaxDeclarations);

router.get("/:id", getEmployeeTaxDeclarationById);

router.get("/employee/:employeeId/financial-year/:financialYearId", getEmployeeDeclaration);

router.put("/:id", updateEmployeeTaxDeclaration);

router.delete("/:id", deleteEmployeeTaxDeclaration);

export default router;