import mongoose from "mongoose";

const taxRegimeSchema = new mongoose.Schema(
{
    financialYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FinancialYear",
        required: true
    },

    regime: {
        type: String,
        enum: ["OLD", "NEW"],
        required: true
    },

    standardDeduction: {
        type: Number,
        default: 0
    },

    rebateAmount: {
        type: Number,
        default: 0
    },

    rebateLimit: {
        type: Number,
        default: 0
    },

    cessPercentage: {
        type: Number,
        default: 4
    },

    active: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

export default mongoose.model("TaxRegime", taxRegimeSchema);