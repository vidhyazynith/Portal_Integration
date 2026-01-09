import Designation from "../models/EmployeeDesignation.js";
 
export const syncDesignationFromHR = async (req, res) => {

  try {

    const {

      id,

      name,

      department,

      description,

      is_active,

      created_at

    } = req.body;
 
    // 🛡️ Minimal validation

    if (!id || !name || !department) {

      return res.status(400).json({

        message: "Invalid HR designation payload"

      });

    }
 
    // 🔁 Upsert (create or update)

    const designation = await Designation.findOneAndUpdate(

      { DesignationId: id },

      {

        $set: {

          name,

          department,

          description,

          isActive: is_active,

          hrCreatedAt: created_at ? new Date(created_at) : null,

          source: "HR"

        }

      },

      { upsert: true, new: true }

    );
 
    return res.status(200).json({

      message: "Designation synced successfully",

      designation: {

        DesignationId: designation.DesignationId,

        name: designation.name

      }

    });
 
  } catch (error) {

    console.error("❌ HR Designation Sync Error:", error);

    return res.status(500).json({

      message: "Failed to sync designation"

    });

  }

};

 
/**

* GET all designations (active + inactive)

*/

export const getAllDesignations = async (req, res) => {

  try {

    const designations = await Designation.find().sort({ name: 1 });
 
    res.json({

      success: true,

      count: designations.length,

      designations

    });
 
  } catch (error) {

    console.error("Get all designations error:", error);

    res.status(500).json({

      success: false,

      message: "Failed to fetch designations"

    });

  }

};
 
 
/**

* GET only ACTIVE designations (used for salary templates & payroll)

*/

export const getActiveDesignations = async (req, res) => {

  try {

    const designations = await Designation.find({ isActive: true })

      .sort({ name: 1 });
 
    res.json({

      success: true,

      count: designations.length,

      designations

    });
 
  } catch (error) {

    console.error("Get active designations error:", error);

    res.status(500).json({

      success: false,

      message: "Failed to fetch active designations"

    });

  }

};
 
 
/**

* GET designation by MongoDB ID

*/

export const getDesignationById = async (req, res) => {

  try {

    const designation = await Designation.findById(req.params.id);
 
    if (!designation) {

      return res.status(404).json({

        success: false,

        message: "Designation not found"

      });

    }
 
    res.json({

      success: true,

      designation

    });
 
  } catch (error) {

    console.error("Get designation by id error:", error);

    res.status(500).json({

      success: false,

      message: "Failed to fetch designation"

    });

  }

};

 
 