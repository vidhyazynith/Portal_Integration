import mongoose from "mongoose";
 
const employeeSchema = new mongoose.Schema(

  {

    

    employeeId: {

      type: String,

      required: true,

      unique: true,

      index: true,

      trim: true

    },
 
    // 👤 Basic details

    name: {

      type: String,

      required: true,

      trim: true

    },
 
    department: {

      type: String,

      required: true,

      trim: true

    },
 
    designation: {

      type: String,

      required: true,

      trim: true

    },
 
    joiningDate: {

      type: Date,

      required: true

    },
 
    // 📞 Optional details

    phone: {

      type: String,

      trim: true

    },
 
    panNumber: {

      type: String,

      uppercase: true,

      trim: true

    },
 
    aadharNumber: {

      type: String,

      trim: true

    },
 
    photo: {

      type: String,

      default: null

    },
        status: {

      type: String,

      enum: ["Active", "Inactive"],

      default: "Active"

    },
    
    source: {

      type: String,

      enum: ["HR"],

      default: "HR"

    }

  },

  {

    timestamps: true

  }

);

 
export default mongoose.model("Employee", employeeSchema);

 