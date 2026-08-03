import EmployeeTaxRegime from '../models/EmployeeTaxRegime.js';

export const assignEmployeeRegime = async (req, res) => {
  try {
    const regime = await EmployeeTaxRegime.create(req.body);

    res.status(201).json({
      success: true,
      data: regime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployeeRegimes = async (req, res) => {
  try {
    const regimes = await EmployeeTaxRegime.find()
      .populate("financialYearId");

    res.status(200).json({
      success: true,
      data: regimes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEmployeeRegime = async (req, res) => {
  try {
    const regime = await EmployeeTaxRegime.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: regime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteEmployeeRegime = async (req, res) => {
  try {
    await EmployeeTaxRegime.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Employee Regime deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};