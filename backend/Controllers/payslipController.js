// // controllers/payslipController.js
// import Payslip from '../models/Payslip.js';
 
// /**
// * GET /api/payslips/employee/:employeeId
// * Used by HR portal to list payslips for an employee
// */
// export const getPayslipsByEmployee = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
    
//     if (!employeeId) {
//       return res.status(400).json({ message: 'Employee ID is required' });
//     }
 
//     const payslips = await Payslip.find({ employeeId })
//       .select(
//         '_id employeeId month year netPay paidDays lopDays sentAt createdAt'
//       )
//       .sort({ year: -1, month: -1 });
 
//     return res.status(200).json({
//       success: true,
//       payslips
//     });
 
//   } catch (error) {
//     console.error('❌ Error fetching payslips:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payslips'
//     });
//   }
// };