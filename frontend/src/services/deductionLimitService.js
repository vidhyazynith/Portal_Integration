import api from './api';

export const deductionLimitService = {
  getDeductionLimits: async () => {
    const response = await api.get('/deduction-limits');
    return response.data;
  },
  createDeductionLimit: async (data) => {
    const response = await api.post('/deduction-limits', data);
    return response.data;
  },
  updateDeductionLimit: async (id, data) => {
    const response = await api.put(`/deduction-limits/${id}`, data);
    return response.data;
  },
  deleteDeductionLimit: async (id) => {
    const response = await api.delete(`/deduction-limits/${id}`);
    return response.data;
  }
};
