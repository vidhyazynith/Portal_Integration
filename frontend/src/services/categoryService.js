import api from './api';

const API_BASE_URL = '/categories';

export const categoryService = {
  // Get all categories grouped by type
  async getAllCategories() {
    const response = await api.get(API_BASE_URL);
    return response.data;
  },

  // Get categories by specific type
  async getCategoriesByType(type) {
    const response = await api.get(`${API_BASE_URL}/${type}`);
    return response.data;
  },

  // Get all transaction categories (income and expense)
  async getTransactionCategories() {
    const response = await api.get(`${API_BASE_URL}/transaction/all`);
    return response.data;
  },

  // Create new category
  async createCategory(categoryData) {
    const response = await api.post(API_BASE_URL, categoryData);
    return response.data;
  },

  // Update category
  async updateCategory(categoryId, categoryData) {
    const response = await api.put(`${API_BASE_URL}/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete category
  async deleteCategory(categoryId) {
    const response = await api.delete(`${API_BASE_URL}/${categoryId}`);
    return response.data;
  },

  // Get category suggestions
  async getCategorySuggestions(type) {
    const response = await api.get(`${API_BASE_URL}/suggestions/${type}`);
    return response.data;
  },

  // Validate category data
  validateCategory(categoryData) {
    const errors = {};

    if (!categoryData.name || categoryData.name.trim() === '') {
      errors.name = 'Category name is required';
    } else if (categoryData.name.length > 100) {
      errors.name = 'Category name cannot exceed 100 characters';
    }

    if (categoryData.description && categoryData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    if (!categoryData.type) {
      errors.type = 'Category type is required';
    }

    return errors;
  }
};

// Default category object
export const defaultCategory = {
  name: '',
  type: '',
  description: ''
};

// Category types configuration
export const categoryTypes = [
 
  {
    id: 'transaction-income',
    title: 'Income Categories',
    description: 'Manage categories for income tracking',
    icon: '💰',
    color: '#27ae60',
    placeholder: 'e.g., Project Revenue',
    suggestions: ['Salary', 'Project Revenue', 'Service Revenue', 'Product Sales', 'Consulting']
  },
  {
    id: 'transaction-expense',
    title: 'Expense Categories',
    description: 'Manage categories for expense tracking',
    icon: '💸',
    color: '#e74c3c',
    placeholder: 'e.g., Office Supplies',
    suggestions: ['Office Rent', 'Software Licenses', 'Marketing', 'Travel', 'Equipment']
  }
];