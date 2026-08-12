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

// Apply auth to ALL routes in this file
router.use(authenticateToken);

// Specific routes FIRST (before /:id)
router.get("/admin/by-status", getDeclarationsByStatus);
router.get("/my/:employeeId/financial-year/:financialYearId", getMyDeclaration);
router.get("/employee/:employeeId/financial-year/:financialYearId", getEmployeeDeclaration);

// General routes
router.get("/", getEmployeeTaxDeclarations);
router.post("/", createEmployeeTaxDeclaration);

// Single ID routes
router.get("/:id", getEmployeeTaxDeclarationById);
router.put("/:id", updateEmployeeTaxDeclaration);
router.delete("/:id", deleteEmployeeTaxDeclaration);
router.post("/:id/submit", submitDeclaration);

// Admin approval routes
router.put("/:id/approve", approveDeclaration);
router.put("/:id/reject", rejectDeclaration);

export default router;