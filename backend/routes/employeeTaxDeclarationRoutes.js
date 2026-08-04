import express from "express";
import { authenticateToken, requireRole } from '../middleware/auth.js';

import {
  createEmployeeTaxDeclaration,
  getEmployeeTaxDeclarations,
  getEmployeeTaxDeclarationById,
  getEmployeeDeclaration,
  updateEmployeeTaxDeclaration,
  deleteEmployeeTaxDeclaration,
  submitDeclaration,
  getMyDeclaration,
  getDeclarationsByStatus,
  approveDeclaration,
  rejectDeclaration
} from "../Controllers/employeeTaxDeclarationController.js";

const router = express.Router();

router.post("/", createEmployeeTaxDeclaration);

router.get("/", getEmployeeTaxDeclarations);

router.get("/:id", getEmployeeTaxDeclarationById);

router.get("/employee/:employeeId/financial-year/:financialYearId", getEmployeeDeclaration);

router.put("/:id", updateEmployeeTaxDeclaration);

router.delete("/:id", deleteEmployeeTaxDeclaration);
// Employee routes
router.post('/:id/submit', submitDeclaration);
router.get('/my/:employeeId/financial-year/:financialYearId', getMyDeclaration);

// Admin routes
router.get('/admin/by-status', getDeclarationsByStatus);
router.put('/:id/approve', approveDeclaration);
router.put('/:id/reject', rejectDeclaration);

export default router;