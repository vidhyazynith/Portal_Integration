import EmployeeTaxDeclaration from "../models/EmployeeTaxDeclaration.js";

// Create Declaration
export const createEmployeeTaxDeclaration = async (req, res) => {
  try {
    const declaration = await EmployeeTaxDeclaration.create(req.body);

    res.status(201).json({
      success: true,
      data: declaration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Declarations
export const getEmployeeTaxDeclarations = async (req, res) => {
  try {
    const declarations = await EmployeeTaxDeclaration.find()
      .populate("financialYearId");

    res.status(200).json({
      success: true,
      count: declarations.length,
      data: declarations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Declaration By Id
export const getEmployeeTaxDeclarationById = async (req, res) => {
  try {
    const declaration = await EmployeeTaxDeclaration.findById(req.params.id)
      .populate("financialYearId");

    if (!declaration) {
      return res.status(404).json({
        success: false,
        message: "Declaration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: declaration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Declaration By Employee + Financial Year
export const getEmployeeDeclaration = async (req, res) => {
  try {
    const { employeeId, financialYearId } = req.params;

    const declaration = await EmployeeTaxDeclaration.findOne({
      employeeId,
      financialYearId,
    }).populate("financialYearId");

    if (!declaration) {
      return res.status(404).json({
        success: false,
        message: "Declaration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: declaration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Declaration
export const updateEmployeeTaxDeclaration = async (req, res) => {
  try {
    const declaration = await EmployeeTaxDeclaration.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!declaration) {
      return res.status(404).json({
        success: false,
        message: "Declaration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: declaration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Declaration
export const deleteEmployeeTaxDeclaration = async (req, res) => {
  try {
    const declaration = await EmployeeTaxDeclaration.findByIdAndDelete(
      req.params.id
    );

    if (!declaration) {
      return res.status(404).json({
        success: false,
        message: "Declaration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Declaration deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};