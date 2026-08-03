import api from './api';

export const taxCalculationService = {
  calculateTax: async (employeeId, financialYearId) => {
    const response = await api.get(`/tax-calculation/employee/${employeeId}/financial-year/${financialYearId}`);
    return response.data;
  }
};
