import {
  calculateEmployeeTax
} from "../services/taxCalculationService.js";

export const calculateTax =
  async (req, res) => {

    try {

      const {
        employeeId,
        financialYearId
      } = req.params;

      const result =
        await calculateEmployeeTax(
          employeeId,
          financialYearId
        );

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
};