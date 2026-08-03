import TaxSlab from "../models/TaxSlab.js";

export const createTaxSlab = async (req, res) => {
  try {
    const slab = await TaxSlab.create(req.body);

    res.status(201).json({
      success: true,
      data: slab,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTaxSlabs = async (req, res) => {
  try {
    const slabs = await TaxSlab.find()
      .populate("taxRegimeId")
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: slabs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTaxSlabById = async (req, res) => {
  try {
    const slab = await TaxSlab.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: slab,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTaxSlab = async (req, res) => {
  try {
    const slab = await TaxSlab.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: slab,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTaxSlab = async (req, res) => {
  try {
    await TaxSlab.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Tax Slab deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};