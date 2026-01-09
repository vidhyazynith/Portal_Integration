import mongoose from "mongoose";
 
const designationSchema = new mongoose.Schema(

  {
    DesignationId: {
      type: Number,
      required: true,
      unique: true
    },
 
    name: {

      type: String,
      required: true,
      trim: true
    },

    department: {

      type: String,
      required: true

    },
 
    description: {

      type: String,
      default: null

    },
 
    isActive: {

      type: Boolean,
      default: true

    },

    source: {

      type: String,
      default: "HR"
    },
 
    hrCreatedAt: {

      type: Date
    }
  },

  {
    timestamps: true // Finance side tracking
  }

);
 
export default mongoose.model("Designation", designationSchema);

 