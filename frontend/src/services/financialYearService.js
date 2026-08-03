import api from './api';

export const financialYearService = {
  getFinancialYears: async () => {
    const response = await api.get('/financial-years');
    return response.data;
  },
  createFinancialYear: async (data) => {
    const response = await api.post('/financial-years', data);
    return response.data;
  },
  updateFinancialYear: async (id, data) => {
    const response = await api.put(`/financial-years/${id}`, data);
    return response.data;
  },
  deleteFinancialYear: async (id) => {
    const response = await api.delete(`/financial-years/${id}`);
    return response.data;
  }
};
