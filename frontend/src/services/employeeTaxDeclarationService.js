import api from './api';

export const employeeTaxDeclarationService = {
  getEmployeeTaxDeclarations: async () => {
    const response = await api.get('/employee-tax-declarations');
    return response.data;
  },
  getEmployeeTaxDeclarationById: async (id) => {
    const response = await api.get(`/employee-tax-declarations/${id}`);
    return response.data;
  },
  getEmployeeDeclaration: async (employeeId, financialYearId) => {
    const response = await api.get(`/employee-tax-declarations/employee/${employeeId}/financial-year/${financialYearId}`);
    return response.data;
  },
  createEmployeeTaxDeclaration: async (data) => {
    const response = await api.post('/employee-tax-declarations', data);
    return response.data;
  },
  updateEmployeeTaxDeclaration: async (id, data) => {
    const response = await api.put(`/employee-tax-declarations/${id}`, data);
    return response.data;
  },
  deleteEmployeeTaxDeclaration: async (id) => {
    const response = await api.delete(`/employee-tax-declarations/${id}`);
    return response.data;
  }
};
