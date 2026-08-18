// services/employee.js
import api from './api';

const extractFilenameFromContentDisposition = (contentDisposition) => {
  if (!contentDisposition) return '';

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1].replace(/['"]/g, ''));
  }

  const standardMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  if (standardMatch) {
    return standardMatch[1];
  }

  return '';
};

export const employeeDashService = {
  // Get employee profile
 async getEmployeeProfile() {
    const response = await api.get('/employee/profile');
    return response.data;
  },

  // Get employee payslips
  async getEmployeePayslips() {
    const response = await api.get('/employee/payslips');
    return response.data;
  },

  // Get salary history
  async getSalaryHistory() {
    const response = await api.get('/employee/salary-history');
    return response.data;
  },

  // Get current salary
  async getCurrentSalary() {
    const response = await api.get('/employee/current-salary');
    return response.data;
  },

  // Get salary statistics
    async getSalaryStats() {
    const response = await api.get('/employee/salary-stats');
    return response.data;
  },

  // Get payslip details
  async getPayslipDetails(payslipId) {
    const response = await api.get(`/employee/payslip/${payslipId}`);
    return response.data;
  },

  // Download payslip PDF
async downloadPayslip(payslipId) {
    const response = await api.get(`/salaries/payslip/${payslipId}/download`, {
      responseType: 'blob'
    });

    const blob = response.data;
    const fileName = extractFilenameFromContentDisposition(
      response.headers?.['content-disposition'] || response.headers?.['Content-Disposition']
    );

    if (fileName) {
      blob.filename = fileName;
    }

    return blob;
  },
};