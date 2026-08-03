import TaxRegime from "../models/TaxRegime.js";

export const createTaxRegime = async (req, res) => {
  try {
    const regime = await TaxRegime.create(req.body);

    res.status(201).json({
      success: true,
      data: regime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTaxRegimes = async (req, res) => {
  try {
    const regimes = await TaxRegime.find()
      .populate("financialYearId");

    res.status(200).json({
      success: true,
      data: regimes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateTaxRegime = async (req, res) => {
  try {
    const regime = await TaxRegime.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: regime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteTaxRegime = async (req, res) => {
  try {
    await TaxRegime.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};