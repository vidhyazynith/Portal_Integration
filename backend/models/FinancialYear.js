import mongoose from "mongoose";

const financialYearSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        unique: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

export default mongoose.model("FinancialYear", financialYearSchema);