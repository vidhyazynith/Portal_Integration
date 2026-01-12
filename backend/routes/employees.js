import express from 'express';
import { //registerEmployee,
  getAllEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByStatus,
  searchEmployees,
 // getCountries,
  getEmployeeStats,
  bulkUpdateStatus,
  syncEmployeeFromHR,
  syncEmployeeStatusFromHR
 } from '../Controllers/employeeController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
 
const router = express.Router();
 
 
//router.post('/register/employee',authenticateToken, requireRole('admin'),registerEmployee);

router.post('/add/employees', syncEmployeeFromHR);

router.post("/update/status", syncEmployeeStatusFromHR);
 
// Get all employees
router.get('/', authenticateToken, getAllEmployee);
 
// Get employee by ID
router.get('/:id', authenticateToken, getEmployeeById);
 
// Update employee
router.put('/:id',updateEmployee );
 
// Delete employee
router.delete('/:id', deleteEmployee);



router.get('/status/:status', authenticateToken, getEmployeesByStatus);
router.get('/search/all', authenticateToken, searchEmployees);

// Location routes
//router.get('/countries/list', authenticateToken, getCountries);

// Additional routes
router.get('/stats/overview', authenticateToken, getEmployeeStats);
router.post('/bulk/status', authenticateToken, bulkUpdateStatus);

 
export default router;