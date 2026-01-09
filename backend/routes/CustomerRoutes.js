import express from "express";
import {  
  getCustomers,
  addCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  getActiveCustomers,
  getCountries,
  getStatesByCountry
} from "../Controllers/CustomerController.js";
import { authenticateToken, requireRole } from '../middleware/auth.js';
 
const router = express.Router();
 
// Customer routes
router.get("/customers", authenticateToken, requireRole('admin'),getCustomers);
router.get("/customers/:id",authenticateToken, requireRole('admin'), getCustomerById);
router.post("/add-customer",authenticateToken, requireRole('admin'), addCustomer);
router.put("/customers/:id", authenticateToken, requireRole('admin'),updateCustomer);
router.delete("/customers/:id", authenticateToken, requireRole('admin'),deleteCustomer);
router.patch("/customers/:id", authenticateToken, requireRole('admin'),updateCustomerStatus);
router.get("/active-customers", authenticateToken, getActiveCustomers);
// Location routes
router.get("/countries/list", authenticateToken, getCountries);
router.get("/states/:countryCode", authenticateToken, getStatesByCountry);

export default router;