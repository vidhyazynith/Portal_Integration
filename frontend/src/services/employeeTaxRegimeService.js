import api from './api';

export const employeeTaxRegimeService = {
  getEmployeeRegimes: async () => {
    const response = await api.get('/employee-tax-regimes');
    return response.data;
  },
  assignEmployeeRegime: async (data) => {
    const response = await api.post('/employee-tax-regimes', data);
    return response.data;
  },
  updateEmployeeRegime: async (id, data) => {
    const response = await api.put(`/employee-tax-regimes/${id}`, data);
    return response.data;
  },
  deleteEmployeeRegime: async (id) => {
    const response = await api.delete(`/employee-tax-regimes/${id}`);
    return response.data;
  }
};
