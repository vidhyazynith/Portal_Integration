import Customer from "../models/Customer.js";
import User from "../models/User.js"; // ADD THIS IMPORT
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import axios from 'axios';
 
// Add customer
export const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, company, customerType, status, paymentTerms } = req.body;
   
    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Contact Person, email, and phone are required fields" });
    }
 
    // Validate address object - UPDATED FOR NEW STRUCTURE
    if (!address ||
        !address.addressLine1 ||
        !address.country ||
        !address.country.code ||
        !address.country.name ||
        !address.state ||
        !address.state.code ||
        !address.state.name ||
        !address.city ||
        !address.pinCode) {
      return res.status(400).json({
        message: 'All address fields are required including country/state code and name'
      });
    }
 
    // Validate phone number format
    if (phone) {
      const phoneNumber = parsePhoneNumberFromString(phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return res.status(400).json({ message: 'Invalid phone number format for the selected country' });
      }
    }
 
    // Validate payment terms
    const paymentTermsValue = paymentTerms || 30;
    if (paymentTermsValue < 0 || paymentTermsValue > 365) {
      return res.status(400).json({ message: "Payment terms must be between 0 and 365 days" });
    }
 
    const lowerEmail = email.toLowerCase();
 
    // ✅ Check if email exists in User collection (including admin/employee users)
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists in the system" });
    }
 
    // Check if customer already exists with same email
    const existingCustomer = await Customer.findOne({ email: lowerEmail });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer with this email already exists" });
    }
 
    const newCustomer = new Customer({
      name,
      email: lowerEmail,
      phone,
      address: {
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        country: {
          code: address.country.code.toUpperCase(),
          name: address.country.name
        },
        state: {
          code: address.state.code.toUpperCase(),
          name: address.state.name
        },
        city: address.city,
        pinCode: address.pinCode
      },
      company: company || '',
      customerType: customerType || 'individual',
      paymentTerms: paymentTermsValue,
      status: status || 'active', // Include status with default value
      joinDate: new Date() // Add join date
    });
   
    // The pre-save middleware will automatically set countryCode and stateCode
    await newCustomer.save();
   
    res.status(201).json({
      message: "Customer added successfully",
      customer: newCustomer
    });
   
  } catch (error) {
    console.error("Error adding customer:", error);
    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({
          message: 'Email already exists. Please use a different email.'
        });
      }
    }
    res.status(500).json({
      message: "Error adding customer",
      error: error.message
    });
  }
};
 
// Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
   
    // Log customer details including address structure
    console.log('Customers with enhanced address structure:');
    customers.forEach(cust => {
      console.log({
        name: cust.name,
        email: cust.email,
        status: cust.status,
        paymentTerms: cust.paymentTerms,
        paymentTermsDisplay: cust.paymentTermsDisplay,
        address: cust.address,
        countryCode: cust.countryCode,
        stateCode: cust.stateCode,
        formattedAddress: cust.formattedAddress
      });
    });
   
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      message: "Error fetching customers",
      error: error.message
    });
  }
};
 
// 🆕 Get all active customers for invoice dropdown
export const getActiveCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      status: 'active'  // Only fetch active customers
    }).select('customerId name email phone company customerType paymentTerms address');
   
    res.json({
      success: true,
      customers
    });
  } catch (error) {
    console.error("Error fetching active customers:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching active customers",
      error: error.message
    });
  }
};
 
// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      message: "Error fetching customer",
      error: error.message
    });
  }
};
 
// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, phone, paymentTerms, email, address, ...otherFields } = req.body;
 
    // Validate phone number if provided
    if (phone) {
      const phoneNumber = parsePhoneNumberFromString(phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return res.status(400).json({
          message: 'Invalid phone number format for the selected country'
        });
      }
    }
 
    // Validate address if provided - UPDATED FOR NEW STRUCTURE
    if (address) {
      if (!address.addressLine1 ||
          !address.country ||
          !address.country.code ||
          !address.country.name ||
          !address.state ||
          !address.state.code ||
          !address.state.name ||
          !address.city ||
          !address.pinCode) {
        return res.status(400).json({
          message: 'All address fields are required including country/state code and name'
        });
      }
    }
 
    // Validate payment terms if provided
    const paymentTermsValue = paymentTerms !== undefined ? paymentTerms : otherFields.paymentTerms;
    if (paymentTermsValue !== undefined && (paymentTermsValue < 0 || paymentTermsValue > 365)) {
      return res.status(400).json({
        message: "Payment terms must be between 0 and 365 days"
      });
    }
   
    // ✅ Validate email if provided AND if it's different from current email
    if (typeof email !== 'undefined') {
      // Get current customer to check if email is actually being changed
      const currentCustomer = await Customer.findById(id);
     
      if (!currentCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
 
      const lowerEmail = email.toLowerCase();
 
      // Only check for duplicates if email is actually being changed
      if (currentCustomer.email !== lowerEmail) {
        // ✅ Check if email exists in User collection (including admin users)
        const existingUser = await User.findOne({ email: lowerEmail });
        if (existingUser) {
          return res.status(400).json({
            message: 'Email already exists in the system'
          });
        }
 
        // ✅ Check if email exists in another customer
        const existingCustomerWithEmail = await Customer.findOne({
          email: lowerEmail,
          _id: { $ne: id } // Exclude the current customer
        });
 
        if (existingCustomerWithEmail) {
          return res.status(400).json({
            message: 'Customer with this email already exists'
          });
        }
      }
    }
   
    // Prepare update object
    const updateData = {
      ...otherFields,
      ...(phone && { phone }),
      ...(paymentTerms !== undefined && { paymentTerms }),
      ...(email && { email: email.toLowerCase() }),
      status: status || 'active' // Ensure status is included
    };
 
    // Handle address update with new structure
    if (address) {
      updateData.address = {
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        country: {
          code: address.country.code.toUpperCase(),
          name: address.country.name
        },
        state: {
          code: address.state.code.toUpperCase(),
          name: address.state.name
        },
        city: address.city,
        pinCode: address.pinCode
      };
     
      // These will be auto-set by the pre-save middleware
      updateData.countryCode = address.country.code.toUpperCase();
      updateData.stateCode = address.state.code.toUpperCase();
    }
   
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
   
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
   
    res.json({
      message: "Updated Customer successfully",
      customer: updatedCustomer
    });
   
  } catch (error) {
    console.error("Error updating customer:", error);
     
    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({
          message: 'Email already exists. Please use a different email.'
        });
      }
    }
    res.status(500).json({
      message: "Error updating customer",
      error: error.message
    });
  }
};
 
// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);
   
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
   
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      message: "Error deleting customer",
      error: error.message
    });
  }
};
 
// Update customer status
export const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
   
    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        message: "Status must be either 'active' or 'inactive'"
      });
    }
   
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
   
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
   
    res.json({
      message: `Customer status updated to ${status} successfully`,
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({
      message: "Error updating customer status",
      error: error.message
    });
  }
};
 
// Add these location API endpoints to your CustomerController.js
export const getCountries = async (req, res) => {
  try {
    console.log('🌍 Fetching countries list...');
 
    // Use REST Countries API
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,cca3');
    console.log('✅ Countries API response received');
   
    const countries = response.data.map(country => ({
      code: country.cca2,
      name: country.name.common
    })).sort((a, b) => a.name.localeCompare(b.name));
 
    console.log(`✅ Found ${countries.length} countries`);
   
    return res.json({
      success: true,
      countries
    });
 
  } catch (error) {
    console.error('❌ Error fetching countries:', error.message);
   
    // Return a proper error response
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch countries list',
      details: error.message
    });
  }
};
 
// Get states by country
export const getStatesByCountry = async (req, res) => {
  try {
    const { countryCode } = req.params;
   
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Country code is required'
      });
    }
 
    // Since REST Countries API doesn't provide states, let's use the same API as employee module
    // You need to use the same API key as in your employee module
    const apiKey = 'TU5EZnkyT05kZmJzT0lXTlN1cXJlYlg1Um1KQWlaOGFPUGdWc2NIdQ=='; // Use your API key
   
    const response = await axios.get(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, {
      headers: {
        'X-CSCAPI-KEY': apiKey
      }
    });
   
    const states = response.data.map(state => ({
      code: state.iso2,
      name: state.name
    })).sort((a, b) => a.name.localeCompare(b.name));
   
    return res.json({
      success: true,
      states
    });
 
  } catch (error) {
    console.error('❌ Error fetching states:', error.message);
   
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch states list',
      details: error.message
    });
  }
};
 
// 🆕 Migration endpoint for existing customers (run once)
export const migrateCustomerAddresses = async (req, res) => {
  try {
    console.log('🔄 Starting customer address migration...');
   
    const customers = await Customer.find({
      $or: [
        { 'address.country': { $type: 'string' } },
        { 'address.state': { $type: 'string' } }
      ]
    });
   
    console.log(`📊 Found ${customers.length} customers with old address format`);
   
    let migratedCount = 0;
    let skippedCount = 0;
   
    for (const customer of customers) {
      let needsUpdate = false;
     
      // Convert string country to object
      if (typeof customer.address.country === 'string') {
        const countryName = customer.address.country;
        let countryCode = countryName.substring(0, 2).toUpperCase();
       
        // Special handling for common countries
        const countryMap = {
          'India': 'IN',
          'United States': 'US',
          'United Kingdom': 'UK',
          'Canada': 'CA',
          'Australia': 'AU'
        };
       
        if (countryMap[countryName]) {
          countryCode = countryMap[countryName];
        }
       
        customer.address.country = {
          code: countryCode,
          name: countryName
        };
        needsUpdate = true;
      }
     
      // Convert string state to object
      if (typeof customer.address.state === 'string') {
        const stateName = customer.address.state;
        let stateCode = stateName.substring(0, 2).toUpperCase();
       
        customer.address.state = {
          code: stateCode,
          name: stateName
        };
        needsUpdate = true;
      }
     
      if (needsUpdate) {
        await customer.save();
        migratedCount++;
        console.log(`✅ Migrated customer: ${customer.name} (${customer.email})`);
      } else {
        skippedCount++;
      }
    }
   
    console.log(`🎉 Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);
   
    res.json({
      success: true,
      message: `Customer address migration completed: ${migratedCount} migrated, ${skippedCount} skipped`,
      migratedCount,
      skippedCount
    });
   
  } catch (error) {
    console.error('❌ Error migrating customer addresses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to migrate customer addresses',
      details: error.message
    });
  }
};
 
// 🆕 Helper function to format address for display
export const getFormattedAddress = (customer) => {
  if (!customer || !customer.address) return '';
 
  const parts = [];
  if (customer.address.addressLine1) parts.push(customer.address.addressLine1);
  if (customer.address.addressLine2) parts.push(customer.address.addressLine2);
 
  const cityStatePin = [];
  if (customer.address.city) cityStatePin.push(customer.address.city);
  if (customer.address.state?.name) cityStatePin.push(customer.address.state.name);
  if (customer.address.pinCode) cityStatePin.push(customer.address.pinCode);
 
  if (cityStatePin.length > 0) parts.push(cityStatePin.join(', '));
  if (customer.address.country?.name) parts.push(customer.address.country.name);
 
  return parts.join('\n');
};
 