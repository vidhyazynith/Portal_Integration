import DeductionLimit from "../models/DeductionLimit.js";

export const createDeductionLimit = async (req, res) => {
  try {
    const deduction = await DeductionLimit.create(req.body);

    res.status(201).json({
      success: true,
      data: deduction,
    });
  } catch (error) {

          // Duplicate combination
    if (error.code === 11000) {

      return res.status(400).json({
        success: false,
        message:
          "Deduction limit already exists for this Financial Year, Regime and Deduction Type."
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDeductionLimits = async (req, res) => {
  try {
    const deductions = await DeductionLimit.find()
      .populate("financialYearId");

    res.status(200).json({
      success: true,
      data: deductions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDeductionLimit = async (req, res) => {
  try {
    const deduction = await DeductionLimit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: deduction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteDeductionLimit = async (req, res) => {
  try {
    await DeductionLimit.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Deduction Limit deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};