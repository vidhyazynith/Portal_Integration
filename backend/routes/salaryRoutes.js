import express from 'express';
import Salary from '../models/Salary.js';
import Payslip from '../models/Payslip.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendPayslipEmail } from '../services/emailService.js';
import PDFDocument from 'pdfkit';
import numberToWords from 'number-to-words';
import axios from "axios";
import path from "path";
import fs from 'fs';
const HR_API = process.env.HR_API_URL || 'http://192.168.88.21:5000'; // HR service URL from env or default

const router = express.Router(); 

// Get all employees for dropdown
router.get('/employees', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'Active' })
    .select('employeeId name email designation department basicSalary');
    res.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error while fetching employees' });
  }
});


// Get employee details by ID
router.get('/employee/:employeeId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error while fetching employee' });
  }
});

// Create salary record - FIXED VERSION
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    console.log('📝 Creating salary record with data:', JSON.stringify(req.body, null, 2));

    const { 
      employeeId, 
      month, 
      year, 
      basicSalary,
      paidDays, 
      lopDays, 
      casualLeaveTaken,
      casualLeaveRemaining,
      sickLeaveTaken,
      sickLeaveRemaining, 
      earnings = [], 
      deductions = [],
    } = req.body;

    // Validate required fields
    if (!employeeId || !month || !year) {
      return res.status(400).json({ 
        message: 'Missing required fields: employeeId, month, year are required' 
      });
    }

    // Validate basicSalary
    if (!basicSalary || isNaN(basicSalary) || basicSalary <= 0) {
      return res.status(400).json({ 
        message: 'Valid basicSalary is required and must be greater than 0' 
      });
    }

    // Check if salary already exists for this employee for the same month and year
    const existingSalary = await Salary.findOne({ 
      employeeId, 
      month, 
      year,
      activeStatus: 'enabled'
    });
    
    if (existingSalary) {
      return res.status(400).json({ 
        message: `Salary record already exists for ${employeeId} for ${month} ${year}` 
      });
    }

    // Get employee details
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.status !== 'Active') {
    return res.status(400).json({
      message: 'Salary cannot be created for inactive employees'
    });
    }

    // Prepare salary data with proper validation
    const salaryData = {
      employeeId,
      name: employee.name,
      email: employee.email,
      designation: employee.designation,
      panNo : employee.panNumber,
      month: month,
      year: parseInt(year),
      basicSalary: parseFloat(basicSalary),
      paidDays: parseFloat(paidDays) || 30,
      lopDays: parseFloat(lopDays) || 0,
      casualLeaveTaken: parseFloat(casualLeaveTaken) || 0,
      casualLeaveRemaining: parseFloat(casualLeaveRemaining) || 0,
      sickLeaveTaken: parseFloat(sickLeaveTaken) || 0,
      sickLeaveRemaining: parseFloat(sickLeaveRemaining) || 0,
      earnings: Array.isArray(earnings) ? earnings.map(earning => ({
        type: earning.type || 'Additional Earning',
        amount: parseFloat(earning.amount) || 0,
        percentage: parseFloat(earning.percentage) || 0,
        calculationType: earning.calculationType || 'amount'
      })) : [],
      deductions: Array.isArray(deductions) ? deductions.map(deduction => ({
        type: deduction.type || 'Deduction',
        amount: parseFloat(deduction.amount) || 0,
        percentage: parseFloat(deduction.percentage) || 0,
        calculationType: deduction.calculationType || 'amount'
      })) : [],
      activeStatus: 'enabled',
      status: 'draft'
    };

    console.log('✅ Processed salary data with automatic leaves:', JSON.stringify(salaryData, null, 2));

    // Create and save salary record
    const salary = new Salary(salaryData);
    
    // Validate before saving
    const validationError = salary.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationError.errors 
      });
    }

    await salary.save();
    console.log('✅ Salary record created successfully with automatic leaves carry-forward:', salary._id);

    res.status(201).json({
      message: 'Salary record created successfully with automatic leaves carry-forward',
      salary: salary.toObject()
    });

  } catch (error) {
    console.error('❌ Error creating salary:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate salary record found for this employee and period' 
      });
    }

    res.status(500).json({ 
      message: 'Server error while creating salary record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all salary records
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ createdAt: -1 });
    res.json({ salaries });
  } catch (error) {
    console.error('Error fetching salaries:', error);
    res.status(500).json({ message: 'Server error while fetching salaries' });
  }
});

// Get salary records for an employee
router.get('/employee/:employeeId/salaries', authenticateToken, async (req, res) => {
  try {
    const salaries = await Salary.find({ 
      employeeId: req.params.employeeId 
    }).sort({ year: -1, month: -1 });
    
    res.json({ salaries });
  } catch (error) {
    console.error('Error fetching employee salaries:', error);
    res.status(500).json({ message: 'Server error while fetching employee salaries' });
  }
});

// Get active salary records for an employee
router.get('/employee/:employeeId/active', authenticateToken, async (req, res) => {
  try {
    const salary = await Salary.findOne({ 
      employeeId: req.params.employeeId,
      activeStatus: 'enabled'
    });
    
    if (!salary) {
      return res.status(404).json({ message: 'No active salary record found for this employee' });
    }
    
    res.json({ salary });
  } catch (error) {
    console.error('Error fetching active salary:', error);
    res.status(500).json({ message: 'Server error while fetching active salary' });
  }
});

// Get disabled salary records
router.get('/disabled', authenticateToken, async (req, res) => {
  try {
    const disabledSalaries = await Salary.find(
  { 
                $or :[ 
      { activeStatus: 'cancelled' },
      { activeStatus: 'disabled' }]}
    );
    res.json({ salaries: disabledSalaries });
  } catch (error) {
    console.error('Error fetching disabled salaries:', error);
    res.status(500).json({ message: 'Server error while fetching disabled salaries' });
  }
});

// Get salary by ID
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json({ salary });
  } catch (error) {
    console.error('Error fetching salary:', error);
    res.status(500).json({ message: 'Server error while fetching salary' });
  }
});

// Update salary record
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json({ 
      message: 'Salary record updated successfully', 
      salary 
    });
  } catch (error) {
    console.error('Error updating salary:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Server error while updating salary' });
  }
});

// Delete salary record
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Also delete associated payslips
    await Payslip.deleteMany({ salaryId: req.params.id });
    
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary:', error);
    res.status(500).json({ message: 'Server error while deleting salary' });
  }
});

// Apply hike to salary record
router.post('/:id/apply-hike', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { startDate, hikePercent } = req.body;

    if (!startDate || !hikePercent) {
      return res.status(400).json({ message: 'Start date and hike percentage are required' });
    }

    if (hikePercent <= 0 || hikePercent > 100) {
      return res.status(400).json({ message: 'Hike percentage must be between 1 and 100' });
    }

    const result = await Salary.applyHike(req.params.id, {
      startDate: new Date(startDate),
      hikePercent: parseFloat(hikePercent)
    });

    res.json({
      message: `Hike of ${hikePercent}% applied successfully. New salary record will be activated on ${startDate}`,
      currentSalary: result.currentSalary,
      newSalary: result.newSalary
    });
  } catch (error) {
    console.error('Error applying hike:', error);
    res.status(500).json({ message: error.message || 'Server error while applying hike' });
  }
});


router.post('/:id/generate-payslip', authenticateToken, requireRole('admin'), async (req, res) => {

  try {
 
    // 🔹 1️⃣ Find salary record first

    const salary = await Salary.findById(req.params.id);
    if (!salary) {

      return res.status(404).json({ message: 'Salary record not found' });
    }
 
    // 🔹 2️⃣ Check salary is active

    if (salary.activeStatus !== 'enabled') {

      return res.status(400).json({

        message: 'Payslip cannot be generated for disabled salary records.'

      });
    }

    // 🔹 2️⃣ Check salary is active
    if (salary.activeStatus !== 'enabled') {
      return res.status(400).json({
        message: 'Payslip cannot be generated for disabled salary records.'
      });
    }

    // ✅ 📅 3️⃣ VALIDATE PAYSLIP GENERATION DATE (ADD HERE)
    const monthIndex = new Date(`${salary.month} 1, ${salary.year}`).getMonth();

    const lastDayOfMonth = new Date(salary.year, monthIndex + 1, 0);
    const firstDayNextMonth = new Date(salary.year, monthIndex + 1, 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    lastDayOfMonth.setHours(0, 0, 0, 0);
    firstDayNextMonth.setHours(0, 0, 0, 0);

    const isValidDate =
      today.getTime() === lastDayOfMonth.getTime() ||
      today.getTime() === firstDayNextMonth.getTime();

    if (!isValidDate) {
      return res.status(400).json({
        message: `Payslip for ${salary.month} ${salary.year} can only be generated on ${lastDayOfMonth.toDateString()} or ${firstDayNextMonth.toDateString()}`
      });
    }
 
    // 🔹 3️⃣ Check if payslip already exists

    const existingPayslip = await Payslip.findOne({
      employeeId: salary.employeeId,
      month: salary.month,
      year: salary.year
    });
 
    if (existingPayslip) {
      return res.status(400).json({
        message: `Payslip already generated for ${salary.month} ${salary.year}`
      });
    }
 
    // 🔥 4️⃣ CALL HR FOR PAYROLL DATA
    let hrData;

    try {

      const monthMap = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12
      };
 
      const numericMonth = monthMap[salary.month] || salary.month;
      const hrResponse = await axios.get(

        `${HR_API}/api/payroll/payroll-data/${salary.employeeId}`,

        {
          params: {
            year: salary.year,
            month: numericMonth
          },

          timeout: 10000
        }
      );
      hrData = hrResponse.data;
      console.log("✅ Payroll data fetched from HR:", hrData);
    } catch (err) {

      console.error("❌ HR ERROR:", err.response?.data || err.message);
      return res.status(500).json({
        message: "Failed to fetch payroll data from HR portal",
        error: err.response?.data || err.message
      });
    }
 
    // 🔹 5️⃣ Update salary safely (cast numbers properly)

    salary.casualLeaveTaken = Number(hrData.casualLeaveTaken) || 0;
    salary.casualLeaveRemaining = Number(hrData.casualLeaveRemaining) || 0;
    salary.sickLeaveTaken = Number(hrData.sickLeaveTaken) || 0;
    salary.sickLeaveRemaining = Number(hrData.sickLeaveRemaining) || 0;
    salary.lopDays = Number(hrData.lopDays) || 0;
    salary.paidDays = Number(hrData.paidDays) || 0;
 
    await salary.save();
 
    // 🔹 6️⃣ Create payslip
    const payslipData = {

      salaryId: salary._id,
      employeeId: salary.employeeId,
      name: salary.name,
      email: salary.email,
      designation: salary.designation,
      panNo: salary.panNo,
      month: salary.month,
      year: salary.year,
      payDate: new Date().toISOString().split('T')[0],
      basicSalary: salary.basicSalary,
      grossEarnings: salary.grossEarnings,
      totalDeductions: salary.totalDeductions,
      netPay: salary.netPay,
      paidDays: salary.paidDays,
      lopDays: salary.lopDays,
      casualLeaveTaken: salary.casualLeaveTaken,
      casualLeaveRemaining: salary.casualLeaveRemaining,
      sickLeaveTaken: salary.sickLeaveTaken,
      sickLeaveRemaining: salary.sickLeaveRemaining,
      earnings: salary.earnings,
      deductions: salary.deductions
    };
    const payslip = new Payslip(payslipData);
    await payslip.save();
 
    // 🔹 7️⃣ Mark salary as paid

    salary.status = 'paid';
    await salary.save();
 
    // 🔹 8️⃣ Send email
    const emailResult = await sendPayslipEmail(payslip);
    return res.json({

      message: 'Payslip generated successfully',
      emailSent: emailResult.success,
      leavesCalculation: {
        casual: {
          taken: salary.casualLeaveTaken,
          remaining: salary.casualLeaveRemaining
        },
        sick: {
          taken: salary.sickLeaveTaken,
          remaining: salary.sickLeaveRemaining
        },
        lopDays: salary.lopDays,
        paidDays: salary.paidDays
      }
    });
 
  } catch (error) {

    console.error('❌ Error generating payslip:', error);
    return res.status(500).json({
      message: 'Server error while generating payslip',
      error: error.message
    });
  }
});
 

// Get payslips for an employee
router.get('/payslips/:employeeId', async (req, res) => {
  try {
    // Step 1: Find all enabled salary records for this employee
    const activeSalaries = await Salary.find({
      employeeId: req.params.employeeId,
      activeStatus: 'enabled'
    }).select('_id');

    if (activeSalaries.length === 0) {
      return res.json({ payslips: [] });
    }

    // Step 2: Extract all active salary IDs
    const activeSalaryIds = activeSalaries.map(s => s._id);

    // Step 3: Find payslips linked to those salary IDs
    const payslips = await Payslip.find({
      employeeId: req.params.employeeId,
      salaryId: { $in: activeSalaryIds }
    }).sort({ createdAt: -1 });

    res.json({ payslips });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ message: 'Server error while fetching payslips' });
  }
});

router.get('/payslip/:id/download', async (req, res) => {
    try {
    const payslip = await Payslip.findById(req.params.id).lean();
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    // Check if the related salary record is active (enabled)
    const salary = await Salary.findById(payslip.salaryId).lean();
    if (!salary || salary.activeStatus !== 'enabled') {
      return res.status(403).json({
        message: 'Payslip cannot be downloaded because the salary record is not active',
      });
    }


     
  // Create PDF
  const doc = new PDFDocument();
  // Create filename using payslip name and month/year
  const filename = `${payslip.name}_${payslip.month}_${payslip.year}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  doc.pipe(res);
  
  // ─── HEADER ───────────────────────────────────────────────────────────────────
  doc.fontSize(15).fillColor("gray").text("Payslip For the Month", 380, 42,{
    width: 170,
    align: 'right'
  });
  doc.fontSize(12).text(`${payslip.month} ${payslip.year}`, 380, 70, {
    width: 170,
    align: 'right'
  });
  
  // ─── LOGO ─────────────────────────────────────────────────────────────────────
  let company = await Company.findOne();
  if (!company) {
    return res.status(404).json({ message: "Company information not found. Please set up company details first." });
  }
  let logoBuffer = null;
  try {
    if (company.logo?.url) {
      const logoResponse = await axios({
        method: 'GET',
        url: company.logo.url,
        responseType: 'arraybuffer',
        timeout: 10000
      });
      logoBuffer = Buffer.from(logoResponse.data);
      console.log("✅ Logo loaded from Cloudinary for download");
    }

  } catch (logoError) {
    console.error("❌ Error loading logo from Cloudinary:", logoError.message);
  }
  
  const logoWidth  = 120;
  const logoHeight = 80;
  const logoX      = 40;

  if (logoBuffer) {

    try {
      doc.image(logoBuffer, logoX, 10, { width: logoWidth, height: logoHeight });
      console.log("✅ Company logo added to PDF");
    } catch (logoError) {
      console.error("❌ Error adding logo to PDF:", logoError.message);
    }
  }
  
  // ─── DIVIDER ──────────────────────────────────────────────────────────────────
  doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#ccc").stroke();
  
  // ─── EMPLOYEE SUMMARY ─────────────────────────────────────────────────────────
  doc.fontSize(12).fillColor("black").text("EMPLOYEE SUMMARY", 50, 130);
  const labelX  = 50;
  const colonX  = 145;
  const valueX  = 158;
  const lineGap = 20;
  let   infoY   = 150;
  const summaryRows = [

    ["Employee Name", payslip.name],
    ["Employee ID",   payslip.employeeId],
    ["Designation",   payslip.designation],
    ["Pay Period",    `${payslip.month} ${payslip.year}`],
    ["Pay Date",      `${payslip.payDate.toLocaleDateString("en-GB")}`],
    ["Pan No",        payslip.panNo],

  ];
  
  summaryRows.forEach(([label, value]) => {
    doc.fontSize(11).fillColor("gray").text(label,  labelX, infoY);
    doc.fontSize(11).fillColor("gray").text(":",    colonX, infoY);
    doc.fontSize(11).fillColor("black").text(value, valueX, infoY);
    infoY += lineGap;

  });
  
  // ─── RIGHT SUMMARY BOXES ──────────────────────────────────────────────────────
  const boxX      = 350;
  const boxY      = 130;
  const boxWidth  = 200;
  const radius    = 10;

  // Net Pay box (green tint)
  doc.save();
  doc.roundedRect(boxX, boxY, boxWidth, 55, radius)
    .fillOpacity(1)
    .fillAndStroke("#f2fef6", "#cccccc");
  doc.restore();
  
  // Paid/LOP box (blue tint)
  doc.save();
  doc.roundedRect(boxX, boxY + 68, boxWidth, 55, radius)
    .fillOpacity(1)
    .fillAndStroke("#e6f3ff", "#cccccc");
  doc.restore();
  
  // Net Pay values
  doc.fontSize(18).fillColor("#0a9f49").font("Helvetica-Bold")
    .text("Rs.", boxX + 15, boxY + 10);
  doc.text(payslip.netPay.toFixed(2), boxX + 46, boxY + 10);
  doc.fontSize(11).fillColor("black").font("Helvetica")
    .text("Total Net Payable", boxX + 15, boxY + 32);
  
  // Paid Days / LOP Days
  doc.fontSize(11).fillColor("black")
    .text("Paid Days :", boxX + 20, boxY + 78);
  doc.text(String(payslip.paidDays), boxX + 120, boxY + 78);
  doc.text("LOP Days :", boxX + 20, boxY + 98);
  doc.text(String(payslip.lopDays), boxX + 120, boxY + 98);
  
  // ─── DIVIDER ──────────────────────────────────────────────────────────────────
  doc.moveTo(50, 283).lineTo(550, 283).strokeColor("#ccc").stroke();
  
  // ─── LEAVE ROW ────────────────────────────────────────────────────────────────
  doc.fontSize(11).fillColor("gray").text("Casual Leave Taken",  50,  293);
  doc.fontSize(11).fillColor("gray").text(":",                  183,  293);
  doc.fontSize(11).fillColor("black").text(String(payslip.casualLeaveTaken), 195, 293);
  doc.fontSize(11).fillColor("gray").text("Sick Leave Taken",   310,  293);
  doc.fontSize(11).fillColor("gray").text(":",                  420,  293);
  doc.fontSize(11).fillColor("black").text(String(payslip.sickLeaveTaken),   432, 293);
  
  // ─── EARNINGS / DEDUCTIONS TABLE ─────────────────────────────────────────────
  const tableX     = 50;
  const tableWidth = 500;
  const rowHeight  = 20;
  const headerH    = 30;
  const minRows    = 3;
  const earningsRows   = Math.max(payslip.earnings.length,   minRows);
  const deductionsRows = Math.max(payslip.deductions.length, minRows);
  const maxRows        = Math.max(earningsRows, deductionsRows);
  const tableHeight = headerH + (maxRows * rowHeight) + 30;
  const tableY      = 310;
  
  // Table border
  doc.save();
  doc.roundedRect(tableX, tableY, tableWidth, tableHeight, radius)
    .fillAndStroke("#ffffff", "#cccccc");
  doc.restore();
  
  // ── Column X positions (consistent everywhere) ────────────────────────────────
  const E_LABEL_X  = tableX + 20;   // Earnings label
  const E_RS_X     = tableX + 155;  // Earnings "Rs."
  const E_AMT_X    = tableX + 172;  // Earnings amount (right-aligned, width 55)
  const D_LABEL_X  = tableX + 265;  // Deductions label
  const D_RS_X     = tableX + 415;  // Deductions "Rs."
  const D_AMT_X    = tableX + 432;  // Deductions amount (right-aligned, width 55)
  
  // Table headers
  doc.fontSize(11).font("Helvetica-Bold").fillColor("black");
  doc.text("EARNINGS",   E_LABEL_X, tableY + 8);
  doc.text("AMOUNT",     E_RS_X,    tableY + 8);
  doc.text("DEDUCTIONS", D_LABEL_X, tableY + 8);
  doc.text("AMOUNT",     D_RS_X,    tableY + 8);
  
  // Dashed header underlines
  doc.moveTo(E_LABEL_X, tableY + 22).lineTo(tableX + 255, tableY + 22)
    .dash(2, { space: 2 }).strokeColor("#999999").stroke().undash();
  doc.moveTo(D_LABEL_X, tableY + 22).lineTo(tableX + 490, tableY + 22)
    .dash(2, { space: 2 }).strokeColor("#999999").stroke().undash();
  
  // Reset font
  doc.fontSize(11).font("Helvetica").fillColor("black");
  
  // Earnings rows
  let ey = tableY + headerH + 8;
  payslip.earnings.forEach(e => {
    doc.text(e.type,                    E_LABEL_X, ey);
    doc.text("Rs.",                     E_RS_X,    ey);
    doc.text(e.amount.toFixed(2),       E_AMT_X,   ey, { align: "right", width: 55 });
    ey += rowHeight;
  });

  for (let i = payslip.earnings.length; i < maxRows; i++) { ey += rowHeight; }
  
  // Deductions rows
  let dy = tableY + headerH + 8;
  payslip.deductions.forEach(d => {
    doc.text(d.type,                    D_LABEL_X, dy);
    doc.text("Rs.",                     D_RS_X,    dy);
    doc.text(d.amount.toFixed(2),       D_AMT_X,   dy, { align: "right", width: 55 });
    dy += rowHeight;
  });

  for (let i = payslip.deductions.length; i < maxRows; i++) { dy += rowHeight; }
  
  // Dashed summary underlines
  const sepY = tableY + headerH + (maxRows * rowHeight) + 8;
  doc.moveTo(E_LABEL_X, sepY).lineTo(tableX + 255, sepY)
    .dash(2, { space: 2 }).strokeColor("#999999").stroke().undash();
  doc.moveTo(D_LABEL_X, sepY).lineTo(tableX + 490, sepY)
    .dash(2, { space: 2 }).strokeColor("#999999").stroke().undash();
  
  // Summary row (Gross Earnings / Total Deductions)
  const sumY = sepY + 8;
  doc.font("Helvetica-Bold").fillColor("black");
  doc.text("Gross Earnings",    E_LABEL_X, sumY);
  doc.text("Rs.",               E_RS_X,    sumY);
  doc.text(payslip.grossEarnings.toFixed(2),  E_AMT_X, sumY, { align: "right", width: 55 });
  doc.text("Total Deductions",  D_LABEL_X, sumY);
  doc.text("Rs.",               D_RS_X,    sumY);
  doc.text(payslip.totalDeductions.toFixed(2), D_AMT_X, sumY, { align: "right", width: 55 });
  
  // ─── NET PAY SECTION ──────────────────────────────────────────────────────────
  const netPayY = tableY + tableHeight + 20;
  
  // Outer box
  doc.save();
  doc.roundedRect(50, netPayY, 500, 45, radius)
    .strokeColor("#cccccc").lineWidth(1).stroke();
  
  // Green right panel
  const greenWidth = 200;
  doc.save();
  doc.roundedRect(50 + (500 - greenWidth), netPayY, greenWidth, 45, radius).clip();
  doc.rect(50 + (500 - greenWidth), netPayY, greenWidth, 45).fill("#e6f9ef");
  doc.restore();
  doc.restore();
  
  // "TOTAL GROSS PAYABLE" label — centered in left 300px zone
  doc.font("Helvetica-Bold").fontSize(10).fillColor("black")
    .text("TOTAL GROSS PAYABLE", 80, netPayY + 18, { width: 300, align: "left" });
  
  // Amount — right-aligned inside green panel
  doc.font("Helvetica-Bold").fontSize(14).fillColor("black")
    .text(`Rs. ${payslip.grossEarnings.toFixed(2)}`, 350, netPayY + 17, {
      align: "right",
      width: 185
    });
  
  // Amount in words — centered below box
  const amountWords = numberToWords.toWords(payslip.grossEarnings)
    .replace(/\b\w/g, c => c.toUpperCase());
  doc.font("Helvetica-Bold").fontSize(10).fillColor("black")
    .text(`${amountWords} Rupees Only`, 50, netPayY + 60, { width: 500, align: "center" });
  // Final divider
  doc.moveTo(50, netPayY + 80).lineTo(550, netPayY + 80).strokeColor("#ccc").stroke();
  doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Server error while generating PDF' });
  }
});
 

// Delete payslip by ID - UPDATED VERSION
router.delete('/payslip/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    // Get the associated salary record
    const salary = await Salary.findById(payslip.salaryId);
    if (salary) {
      // Update salary status back to 'draft' when payslip is deleted
      salary.status = 'draft';
      await salary.save();
    }

    // Delete the payslip
    await Payslip.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Payslip deleted successfully and salary status reset to draft',
      salaryUpdated: !!salary 
    });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ message: 'Server error while deleting payslip' });
  }
});


// Get hike history for an employee
router.get('/employee/:employeeId/hike-history', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year, latest } = req.query;

    // Build query for salaries with applied hikes
    let query = {
      employeeId,
      'hike.applied': true
    };

    let sortOrder = { 'hike.startDate': -1 };
    let limit = null;

    // If latest flag is true, return only the most recent hike
    if (latest === 'true') {
      limit = 1;
    }
    // If month/year filters are provided, show hikes for that period
    else if (month && year) {
      query.month = month;
      query.year = parseInt(year);
    } else if (month) {
      query.month = month;
    } else if (year) {
      query.year = parseInt(year);
    }
    // If no filters and not latest, return all hikes sorted by date
    // (this case might not be used with the new frontend logic)

    let hikeHistory = await Salary.find(query)
      .select('month year basicSalary hike.startDate hike.hikePercent hike.previousbasicSalary createdAt')
      .sort(sortOrder)
      .limit(limit);

    // Transform data to show hike details
    const formattedHistory = hikeHistory.map(salary => ({
      _id: salary._id,
      month: salary.month,
      year: salary.year,
      hikePercentage: salary.hike.hikePercent,
      hikeStartDate: salary.hike.startDate,
      previousBasicSalary: salary.hike.previousbasicSalary,
      newBasicSalary: salary.basicSalary,
      hikeAmount: salary.basicSalary - (salary.hike.previousbasicSalary || 0),
      appliedAt: salary.createdAt
    }));

    res.json({ 
      hikeHistory: formattedHistory,
      isLatest: latest === 'true',
      hasFilters: !!(month || year)
    });
  } catch (error) {
    console.error('Error fetching hike history:', error);
    res.status(500).json({ message: 'Server error while fetching hike history' });
  }
});

export default router;