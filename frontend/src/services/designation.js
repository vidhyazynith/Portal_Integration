import api from './api';

export const designationService = {

  async getDesignations() {
    const response = await api.get('/designations');
    return response.data;
  },

  async getActiveDesignations() {
    const response = await api.get('/designations/active');
    return response.data;
  },

  async getDesignationById(designationId) {
    const response = await api.get(`/designations/${designationId}`);
    return response.data;
  }

};
