import Salary from "../models/Salary.js";
import TaxRegime from "../models/TaxRegime.js";
import TaxSlab from "../models/TaxSlab.js";
import EmployeeTaxRegime from "../models/EmployeeTaxRegime.js";
import EmployeeTaxDeclaration from "../models/EmployeeTaxDeclaration.js";

import { calculateTaxBySlabs } from "../utils/calculateTaxBySlabs.js";

export const calculateEmployeeTax = async (
  employeeId,
  financialYearId
) => {

  // Employee Regime
  const employeeRegime =
    await EmployeeTaxRegime.findOne({
      employeeId,
      financialYearId,
    });

  if (!employeeRegime) {
    throw new Error(
      "Employee regime not found"
    );
  }

  // Tax Declaration
let declaration = null;

if (employeeRegime.regime === "OLD") {

  declaration =
    await EmployeeTaxDeclaration.findOne({
      employeeId,
      financialYearId
    });

  if (!declaration) {
    throw new Error(
      "Employee tax declaration not found"
    );
  }
}

  // Latest Salary
  const salary =
    await Salary.findOne({
      employeeId
    }).sort({
      createdAt: -1
    });

  if (!salary) {
    throw new Error(
      "Salary record not found"
    );
  }

  // Tax Regime Master
  const taxRegime =
    await TaxRegime.findOne({
      financialYearId,
      regime:
        employeeRegime.regime,
      active: true
    });

  if (!taxRegime) {
    throw new Error(
      "Tax regime configuration not found"
    );
  }

  // Slabs
  const slabs =
    await TaxSlab.find({
      taxRegimeId:
        taxRegime._id,
      active: true
    }).sort({
      order: 1
    });

  //-----------------------------------
  // Annual Salary
  //-----------------------------------

  const annualIncome =
    salary.grossEarnings * 12;

  //-----------------------------------
  // Other Income
  //-----------------------------------

const otherIncome =
  employeeRegime.regime === "OLD"
    ? declaration.deductionTypes.otherIncome
    : 0;
  
  //-----------------------------------
  // House Property
  //-----------------------------------

const housePropertyIncome =
  employeeRegime.regime === "OLD"
    ? (
        declaration.deductionTypes.rentalIncomeReceived -
        declaration.deductionTypes.municipalTaxPaid -
        declaration.deductionTypes.housingLoanInterestLetOut
      )
    : 0;

  //-----------------------------------
  // Gross Total Income
  //-----------------------------------

  const grossTotalIncome =
    annualIncome +
    otherIncome +
    housePropertyIncome;

  //-----------------------------------
  // HRA Exemption
  //-----------------------------------

  let hraExemption = 0;

  if (
    employeeRegime.regime === "OLD"
  ) {

    const hra =
      declaration.exemptionDetails
        .hraCalculation;

    const option1 =
      hra.houseRentAllowanceReceivedPA;

    const option2 =
      hra.totalRentPaid -
      (
        hra.basicPayReceivedPA *
        0.10
      );

    const option3 =
      hra.metroCity
        ? (
            hra.basicPayReceivedPA +
            hra.dearnessAllowanceReceivedPA
          ) * 0.50
        : (
            hra.basicPayReceivedPA +
            hra.dearnessAllowanceReceivedPA
          ) * 0.40;

    hraExemption =
      Math.max(
        0,
        Math.min(
          option1,
          option2,
          option3
        )
      );
  }

  //-----------------------------------
  // Deductions
  //-----------------------------------
    const getEligibleDeduction = (section) => {
    if (!section || !section.amount) {
      return 0;
    }

    if (!section.exemptionLimit) {
      return section.amount;
    }

    return Math.min(
      section.amount,
      section.exemptionLimit
    );
  };

  let totalDeductions = 0;

  if (
    employeeRegime.regime === "OLD"
  ) {

totalDeductions += hraExemption;

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.interestPaidOnHousingLoan
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section123
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section124
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section124_1B
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section126
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section129
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section131
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section132
    );

    totalDeductions += getEligibleDeduction(
      declaration.exemptionDetails.section133
    );
  }

  //-----------------------------------
  // Taxable Income
  //-----------------------------------

  let taxableIncome =
    grossTotalIncome -
    taxRegime.standardDeduction;

  if (
    employeeRegime.regime === "OLD"
  ) {

    taxableIncome =
      taxableIncome -
      totalDeductions;
  }

  taxableIncome =
    Math.max(
      0,
      taxableIncome
    );

  //-----------------------------------
  // Slab Tax
  //-----------------------------------

  let tax =
    calculateTaxBySlabs(
      taxableIncome,
      slabs
    );

  //-----------------------------------
  // Rebate
  //-----------------------------------

  let rebateApplied = 0;

  if (
    taxRegime.rebateLimit &&
    taxableIncome <=
      taxRegime.rebateLimit
  ) {

    rebateApplied =
      Math.min(
        tax,
        taxRegime.rebateAmount || 0
      );

    tax =
      Math.max(
        0,
        tax - rebateApplied
      );
  }

  //-----------------------------------
  // Cess
  //-----------------------------------

  const cess =
    (
      tax *
      taxRegime.cessPercentage
    ) / 100;

  //-----------------------------------
  // Final Tax
  //-----------------------------------

  const annualTax =
    Math.round(
      tax + cess
    );

  const monthlyTDS =
    Math.ceil(
      annualTax / 12
    );

  return {
    employeeId,
    regime:
      employeeRegime.regime,

    annualIncome,

    otherIncome,

    housePropertyIncome,

    grossTotalIncome,

    totalDeductions,

    standardDeduction:
      taxRegime.standardDeduction,

    taxableIncome,

    taxBeforeCess: tax,

    rebateApplied,

    cess,

    annualTax,

    monthlyTDS
  };
};