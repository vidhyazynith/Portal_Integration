import mongoose from "mongoose";

const employeeTaxDeclarationSchema = new mongoose.Schema(
{
    employeeId: {
        type: String,
        ref: "Employee",
        required: true
    },

    financialYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FinancialYear",
        required: true
    },

    ageCategory: {
        type: String,
        enum: [
            "LESS_THAN_60",
            "BETWEEN_60_AND_80",
            "ABOVE_80"
        ],
        required: true
    },

    deductionTypes: {

        rentalIncomeReceived: {
            type: Number,
            default: 0
        },

        municipalTaxPaid: {
            type: Number,
            default: 0
        },

        housingLoanInterestLetOut: {
            type: Number,
            default: 0
        },

        otherIncome: {
            type: Number,
            default: 0
        }
    },

    exemptionDetails: {

        hraAndOtherExemptions: {
            type: Number,
            default: 0
        },

        hraCalculation: {

            basicPayReceivedPA: {
                type: Number,
                default: 0
            },

            dearnessAllowanceReceivedPA: {
                type: Number,
                default: 0
            },

            houseRentAllowanceReceivedPA: {
                type: Number,
                default: 0
            },

            totalRentPaid: {
                type: Number,
                default: 0
            },

            metroCity: {
                type: Boolean,
                default: false
            }
        },

        interestPaidOnHousingLoan: {
            amount: {
                type: Number,
                default: 0
            },
            exemptionLimit: {
                type: Number,
                default: 0
            }
        },

        section123: {
            amount: {
                type: Number,
                default: 0
            },
            exemptionLimit: {
                type: Number,
                default: 0
            }
        },

        section124: {
            amount: {
                type: Number,
                default: 0
            },
            exemptionLimit: {
                type: Number,
                default: 0
            }
        },

        section124_1B: {
            amount: {
                type: Number,
                default: 0
            },
            exemptionLimit: {
                type: Number,
                default: 0
            }
        },

        section126: {
            amount: {
                type: Number,
                default: 0
            },
            exemptionLimit: {
                type: Number,
                default: 0
            }
        },

        section129: {
            amount: {
                type: Number,
                default: 0
            }
        },

        section131: {
            amount: {
                type: Number,
                default: 0
            },
            exemptionLimit: {
                type: Number,
                default: 0
            }
        },

        section132: {
            amount: {
                type: Number,
                default: 0
            },
            exemptionLimit: {
                type: Number,
                default: 0
            }
        },

        section133: {
            amount: {
                type: Number,
                default: 0
            }
        }
    },
        declarationStatus: {
        type: String,
        enum: [
            "DRAFT",
            "SUBMITTED",
            "APPROVED",
            "REJECTED"
        ],
            default: "DRAFT"
        },

        submittedAt: {
            type: Date
        },

        reviewedAt: {
            type: Date
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        rejectionReason: {
            type: String,
            default: ""
        }
},
{
    timestamps: true
});

export default mongoose.model(
    "EmployeeTaxDeclaration",
    employeeTaxDeclarationSchema
);