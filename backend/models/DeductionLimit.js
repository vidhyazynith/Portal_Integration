import mongoose from "mongoose";

const deductionLimitSchema = new mongoose.Schema(
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

    deductionType: {
        type: String,
        enum: [
            "INTEREST_PAID_ON_HOUSING_LOAN",
            "SECTION_123_PF_PPF_INSURANCE_PREMIUM",
            "SECTION_124_EMPLOYEE_NPS_CONTRIBUTION",
            "SECTION_124_1B_ADDITIONAL_NPS_CONTRIBUTION",
            "SECTION_126_MEDICAL_INSURANCE_PREMIUM",
            "SECTION_129_EDUCATION_LOAN_INTEREST",
            "SECTION_131_AFFORDABLE_HOUSING_LOAN_INTEREST",
            "SECTION_132_ELECTRIC_VEHICLE_LOAN_INTEREST",
            "SECTION_133_DONATIONS_TO_CHARITY",
            "HRA_AND_OTHER_EXEMPTIONS"
        ],
        required: true
    },

    maximumAmount: {
        type: Number,
        required: true,
        min: 0
    },

    active: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});
// Unique per Financial Year + Deduction
deductionLimitSchema.index(
{
    financialYearId: 1,
    regime : 1,
    deductionType: 1
},
{
    unique: true
});

export default mongoose.model(
    "DeductionLimit",
    deductionLimitSchema
);