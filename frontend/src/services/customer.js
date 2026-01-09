import api from './api';
 
export const customerService = {
  async getCustomers() {
    const response = await api.get('/Customer/customers');
    return response.data;
  },
 
  async getCustomerById(customerId) {
    const response = await api.get(`/Customer/customers/${customerId}`);
    return response.data;
  },
 
  async createCustomer(customerData) {
  // Format the address data for the new structure
  const response = await api.post('/Customer/add-customer', customerData);
  return response.data;
  },

  async updateCustomer(customerId, customerData) {
    // Format the address data for the new structure
    const response = await api.put(`/Customer/customers/${customerId}`, customerData);
    return response.data;
  },  
 
  async deleteCustomer(customerId) {
    const response = await api.delete(`/Customer/customers/${customerId}`);
    return response.data;
  },
 
  async updateCustomerStatus(customerId, status) {
    const response = await api.patch(`/Customer/customers/${customerId}`, { status });
    return response.data;
  },
 
  async getActiveCustomers() {
    const response = await api.get('/Customer/active-customers');
    return response.data;
  },
 
  async getCountries() {
    const response = await api.get('/Customer/countries/list');
    return response.data.countries || response.data;
  },
 
  async getStates(countryCode) {
    const response = await api.get(`/Customer/states/${countryCode}`);
    return response.data.states || response.data;
  },
 
  // Helper function to format customer data for the new address structure
// Helper function to format customer data for the new address structure
formatCustomerData(customerData) {
  // const formattedData = { ...customerData };
  
  // // Don't modify if there's no address
  // if (!formattedData.address) return formattedData;
  
  // // If address is already in the new format (has country.code and state.code), return as-is
  // if (formattedData.address.country &&
  //     formattedData.address.state &&
  //     !formattedData.address.country.code && 
  //     !formattedData.address.state.code) {
  //   // This means we have the simplified frontend format, need to convert to backend format
    
  //   // Find country name from the countries list
  //   const countryObj = countries.find(c => c.code === formattedData.address.country) || 
  //                     { code: formattedData.address.country, name: formattedData.address.country };
    
  //   // Find state name from the states list
  //   const stateObj = states.find(s => s.code === formattedData.address.state) || 
  //                   { code: formattedData.address.state, name: formattedData.address.state };
    
  //   formattedData.address = {
  //     addressLine1: formattedData.address.addressLine1 || '',
  //     addressLine2: formattedData.address.addressLine2 || '',
  //     country: {
  //       code: countryObj.code,
  //       name: countryObj.name
  //     },
  //     state: {
  //       code: stateObj.code,
  //       name: stateObj.name
  //     },
  //     city: formattedData.address.city || '',
  //     pinCode: formattedData.address.pinCode || ''
  //   };
  // }
  
  return formattedData;
},
 
  // Helper function to extract address for display
  formatAddressForDisplay(customer) {
    if (!customer || !customer.address) return '';
   
    const addr = customer.address;
    const parts = [];
   
    if (addr.addressLine1) parts.push(addr.addressLine1);
    if (addr.addressLine2) parts.push(addr.addressLine2);
   
    const cityStatePin = [];
    if (addr.city) cityStatePin.push(addr.city);
   
    // Handle both old and new state format
    if (addr.state) {
      if (typeof addr.state === 'string') {
        cityStatePin.push(addr.state);
      } else if (addr.state.name) {
        cityStatePin.push(addr.state.name);
      }
    }
   
    if (addr.pinCode) cityStatePin.push(addr.pinCode);
   
    if (cityStatePin.length > 0) parts.push(cityStatePin.join(', '));
   
    // Handle both old and new country format
    if (addr.country) {
      if (typeof addr.country === 'string') {
        parts.push(addr.country);
      } else if (addr.country.name) {
        parts.push(addr.country.name);
      }
    }
   
    return parts.join('\n');
  },
 
  // Run migration for existing customers (call this once from admin panel)
  async migrateCustomerAddresses() {
    const response = await api.post('/Customer/migrate-addresses');
    return response.data;
  }
};