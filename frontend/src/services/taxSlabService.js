import api from './api';

export const taxSlabService = {
  getTaxSlabs: async () => {
    const response = await api.get('/tax-slabs');
    return response.data;
  },
  getTaxSlabById: async (id) => {
    const response = await api.get(`/tax-slabs/${id}`);
    return response.data;
  },
  createTaxSlab: async (data) => {
    const response = await api.post('/tax-slabs', data);
    return response.data;
  },
  updateTaxSlab: async (id, data) => {
    const response = await api.put(`/tax-slabs/${id}`, data);
    return response.data;
  },
  deleteTaxSlab: async (id) => {
    const response = await api.delete(`/tax-slabs/${id}`);
    return response.data;
  }
};
