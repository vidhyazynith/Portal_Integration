import FinancialYear from "../models/FinancialYear.js";

export const createFinancialYear = async (req, res) => {
  try {
    const financialYear = await FinancialYear.create(req.body);

    res.status(201).json({
      success: true,
      data: financialYear,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFinancialYears = async (req, res) => {
  try {
    const financialYears = await FinancialYear.find().sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      data: financialYears,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFinancialYearById = async (req, res) => {
  try {
    const financialYear = await FinancialYear.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: financialYear,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateFinancialYear = async (req, res) => {
  try {
    const financialYear = await FinancialYear.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: financialYear,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteFinancialYear = async (req, res) => {
  try {
    await FinancialYear.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Financial Year deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getActiveFinancialYear = async (req, res) => {
  try {
    const financialYear = await FinancialYear.findOne({
      active: true
    });

    if (!financialYear) {
      return res.status(404).json({
        success: false,
        message: "No active financial year found"
      });
    }

    res.status(200).json({
      success: true,
      data: financialYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};