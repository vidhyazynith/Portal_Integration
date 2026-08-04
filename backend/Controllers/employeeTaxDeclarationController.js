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

export const submitDeclaration = async (req, res) => {
  try {
    const { id } = req.params;
    const declaration = await EmployeeTaxDeclaration.findOne({
      _id: id,
      employeeId: req.user.employeeId || req.body.employeeId
    });

    if (!declaration) {
      return res.status(404).json({ message: 'Declaration not found' });
    }

    if (declaration.declarationStatus !== 'DRAFT' && declaration.declarationStatus !== 'REJECTED') {
      return res.status(400).json({ message: 'Only DRAFT or REJECTED declarations can be submitted' });
    }

    declaration.declarationStatus = 'SUBMITTED';
    declaration.submittedAt = new Date();
    declaration.rejectionReason = ''; // clear previous reason
    await declaration.save();

    res.json({ success: true, message: 'Declaration submitted for admin review', data: declaration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get declarations by status
export const getDeclarationsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { declarationStatus: status } : {};
    
    const declarations = await EmployeeTaxDeclaration.find(filter)
      .populate('financialYearId', 'name startDate endDate')
      .sort({ submittedAt: -1 });

    res.json({ success: true, data: declarations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Approve declaration
export const approveDeclaration = async (req, res) => {
  try {
    const { id } = req.params;
    const declaration = await EmployeeTaxDeclaration.findById(id);

    if (!declaration) {
      return res.status(404).json({ message: 'Declaration not found' });
    }

    if (declaration.declarationStatus !== 'SUBMITTED') {
      return res.status(400).json({ message: 'Only SUBMITTED declarations can be approved' });
    }

    declaration.declarationStatus = 'APPROVED';
    declaration.reviewedAt = new Date();
    declaration.reviewedBy = req.user._id;
    await declaration.save();

    res.json({ success: true, message: 'Declaration approved successfully', data: declaration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Reject declaration
export const rejectDeclaration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const declaration = await EmployeeTaxDeclaration.findById(id);

    if (!declaration) {
      return res.status(404).json({ message: 'Declaration not found' });
    }

    if (declaration.declarationStatus !== 'SUBMITTED') {
      return res.status(400).json({ message: 'Only SUBMITTED declarations can be rejected' });
    }

    declaration.declarationStatus = 'REJECTED';
    declaration.reviewedAt = new Date();
    declaration.reviewedBy = req.user._id;
    declaration.rejectionReason = reason || 'No reason provided';
    await declaration.save();

    res.json({ success: true, message: 'Declaration rejected', data: declaration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Employee: Get my declaration for a FY (with status)
export const getMyDeclaration = async (req, res) => {
  try {
    const { employeeId, financialYearId } = req.params;
    
    const declaration = await EmployeeTaxDeclaration.findOne({ 
      employeeId, 
      financialYearId 
    }).populate('financialYearId', 'name');

    // Also get regime
    const regime = await EmployeeTaxRegime.findOne({ employeeId, financialYearId });

    res.json({ 
      success: true, 
      data: declaration,
      regime: regime ? regime.regime : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
