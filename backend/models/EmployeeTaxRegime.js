import mongoose from "mongoose";

const employeeTaxRegimeSchema = new mongoose.Schema(
{
    employeeId: {
        type: String,
        ref: "Employee",
        required: true,
        unique : true
    },

    financialYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FinancialYear",
        required: true
    },

    regime: {
        type: String,
        enum: ["OLD", "NEW"],
        required: true
    }
},
{
    timestamps: true
});

export default mongoose.model("EmployeeTaxRegime", employeeTaxRegimeSchema);