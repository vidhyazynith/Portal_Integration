import api from './api';

export const taxRegimeService = {
  getTaxRegimes: async () => {
    const response = await api.get('/tax-regimes');
    return response.data;
  },
  createTaxRegime: async (data) => {
    const response = await api.post('/tax-regimes', data);
    return response.data;
  },
  updateTaxRegime: async (id, data) => {
    const response = await api.put(`/tax-regimes/${id}`, data);
    return response.data;
  },
  deleteTaxRegime: async (id) => {
    const response = await api.delete(`/tax-regimes/${id}`);
    return response.data;
  }
};
