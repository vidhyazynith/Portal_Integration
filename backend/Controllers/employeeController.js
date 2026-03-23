import Employee from "../models/Employee.js";
import User from '../models/User.js';
import { sendEmployeeCredentials } from '../services/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import bcrypt from "bcryptjs";
import SalaryTemplate from '../models/SalaryTemplate.js';
import Salary from "../models/Salary.js";
 
export const syncEmployeeStatusFromHR = async (req, res) => {
  try {
    const { employeeId, status } = req.body;
 
    if (!employeeId || !status) {
      return res.status(400).json({
        message: "employeeId and status are required"
      });
    }
 
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }
 
    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { $set: { status } },
      { new: true }
    );
 
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found in finance"
      });
    }
 
    return res.status(200).json({
      message: "Employee status synced successfully",
      employeeId: employee.employeeId,
      status: employee.status
    });
 
  } catch (error) {
    console.error("❌ Employee status sync error:", error);
    return res.status(500).json({
      message: "Failed to sync employee status"
    });
  }
};

export const syncEmployeeFromHR = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      department,
      designation,
      joiningDate,
      phone,
      panNumber,
      aadharNumber,
      status
    } = req.body;

    // 🔴 Mandatory validations (as per schema)
    if (!employeeId || !name || !email || !department || !designation || !joiningDate) {
      return res.status(400).json({
        message: "employeeId, name, email, department, designation, joiningDate are required"
      });
    }

    const lowerEmail = email.toLowerCase();

    // 🔍 Check if employee already exists
    const existingEmployee = await Employee.findOne({ employeeId });

    // 🔍 Email uniqueness check (only if new or email changed)
    if (!existingEmployee || existingEmployee.email !== lowerEmail) {
      const emailExistsInEmployee = await Employee.findOne({
        email: lowerEmail,
        employeeId: { $ne: employeeId }
      });

      if (emailExistsInEmployee) {
        return res.status(400).json({ message: "Email already exists for another employee" });
      }

      const emailExistsInUser = await User.findOne({ email: lowerEmail });
      if (emailExistsInUser) {
        return res.status(400).json({ message: "Email already exists in user system" });
      }
    }

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          employeeId,
          name,
          email: lowerEmail,
          department,
          designation,
          joiningDate: new Date(joiningDate),
          phone,
          panNumber,
          aadharNumber,
          source: "HR",
          status: status || "Active"
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ✅ Create salary ONLY for new employee
    if (!existingEmployee) {
      await createEmployeeSalary(employee);
    }

    return res.status(200).json({
      message: "Employee synced successfully from HR",
      employeeId: employee.employeeId
    });

  } catch (error) {
    console.error("❌ HR Sync Error:", error);
    return res.status(500).json({
      message: "Failed to sync employee from HR",
      error: error.message
    });
  }
};

//automatically create salary when employee is registered
const createEmployeeSalary = async (employee) => {
  try {
    // Find salary template by designation
    const salaryTemplate = await SalaryTemplate.getTemplateByDesignation(employee.designation);
    
    if (!salaryTemplate) {
      console.log(`No salary template found for designation: ${employee.designation}`);
      return null;
    }

    // Create salary record from template
    const salary = await SalaryTemplate.createSalaryFromTemplate(employee, salaryTemplate);
    console.log(`✅ Salary record created automatically for employee: ${employee.employeeId}`);
    
    return salary;
  } catch (error) {
    console.error('❌ Error creating automatic salary:', error);
    return null;
  }
};
 
// Get all employees
export const getAllEmployee = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
   
    console.log('Employees with status:');
   
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching employees' });
  }
};
 
// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching employee' });
  }
};
 
  // Update employee
 export const updateEmployee = async (req, res) => {
  try {
    const { phone, panNumber, email, status, ...otherFields } = req.body;
    const employeeId = req.params.id;

    const currentEmployee = await Employee.findOne({ employeeId });
    if (!currentEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const updateData = {
      ...otherFields,
      status: status || currentEmployee.status
    };

    // 📞 Phone validation
    if (typeof phone !== 'undefined') {
      const phoneNumber = parsePhoneNumberFromString(phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
      updateData.phone = phoneNumber.number;
    }

    // 📧 Email validation
    if (typeof email !== 'undefined') {
      const lowerEmail = email.toLowerCase();

      if (currentEmployee.email !== lowerEmail) {
        const emailExistsInEmployee = await Employee.findOne({
          email: lowerEmail,
          employeeId: { $ne: employeeId }
        });

        if (emailExistsInEmployee) {
          return res.status(400).json({ message: 'Email already exists for another employee' });
        }

        const emailExistsInUser = await User.findOne({ email: lowerEmail });
        if (emailExistsInUser) {
          return res.status(400).json({ message: 'Email already exists in the system' });
        }
      }

      updateData.email = lowerEmail;
    }

    // 🆔 PAN validation
    if (panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const upperPan = panNumber.toUpperCase();

      if (!panRegex.test(upperPan)) {
        return res.status(400).json({
          message: 'Invalid PAN format (ABCDE1234F)'
        });
      }

      if (currentEmployee.panNumber !== upperPan) {
        const panExists = await Employee.findOne({
          panNumber: upperPan,
          employeeId: { $ne: employeeId }
        });

        if (panExists) {
          return res.status(400).json({
            message: 'PAN number already exists for another employee'
          });
        }
      }

      updateData.panNumber = upperPan;
    }

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Employee updated successfully',
      employee
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error while updating employee' });
  }
};

 
// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const employee = await Employee.findOneAndDelete({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete linked user account (if exists)
    await User.findOneAndDelete({ personId: employeeId });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error while deleting employee' });
  }
};
 
// Get employees by status
export const getEmployeesByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use "Active" or "Inactive".'
      });
    }

    const employees = await Employee.find({ status })
      .sort({ createdAt: -1 })
      .select(
        'employeeId name email department designation phone panNumber aadharNumber joiningDate status source createdAt'
      );

    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Error fetching employees by status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employees by status'
    });
  }
};

 
// Search employees
export const searchEmployees = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    const employees = await Employee.find({
      $or: [
        { employeeId: searchRegex },
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { designation: searchRegex },
        { panNumber: searchRegex },
        { aadharNumber: searchRegex }
      ]
    })
      .sort({ createdAt: -1 })
      .select(
        'employeeId name email department designation phone panNumber aadharNumber joiningDate status source createdAt'
      );

    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching employees'
    });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'Inactive' });
   
    // Get employees by department
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get employees by designation
    const designationStats = await Employee.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        byDepartment: departmentStats,
        byDesignation: designationStats
      }
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employee statistics'
    });
  }
};

// Bulk update employee status
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { employeeIds, status } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Employee IDs array is required'
      });
    }

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "Active" or "Inactive".'
      });
    }

    const result = await Employee.updateMany(
      { employeeId: { $in: employeeIds } },
      { $set: { status: status } }
    );

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} employees to ${status} status`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk update'
    });
  }
};
