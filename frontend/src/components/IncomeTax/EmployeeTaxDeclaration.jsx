import React, { useState, useEffect } from 'react';
import { employeeTaxDeclarationService } from '../../services/employeeTaxDeclarationService';
import { financialYearService } from '../../services/financialYearService';
import { deductionLimitService } from '../../services/deductionLimitService';
import { employeeTaxRegimeService } from '../../services/employeeTaxRegimeService';
import api from '../../services/api';
import './IncomeTax.css';

const AGE_CATEGORIES = [
  { value: 'LESS_THAN_60', label: 'Less than 60 years' },
  { value: 'BETWEEN_60_AND_80', label: '60 to 80 years' },
  { value: 'ABOVE_80', label: 'Above 80 years' }
];

// Map form section keys to deduction limit types from DeductionLimitManagement
const DEDUCTION_TYPE_MAP = {
  interestPaidOnHousingLoan: 'INTEREST_PAID_ON_HOUSING_LOAN',
  section123: 'SECTION_123_PF_PPF_INSURANCE_PREMIUM',
  section124: 'SECTION_124_EMPLOYEE_NPS_CONTRIBUTION',
  section124_1B: 'SECTION_124_1B_ADDITIONAL_NPS_CONTRIBUTION',
  section126: 'SECTION_126_MEDICAL_INSURANCE_PREMIUM',
  section129: 'SECTION_129_EDUCATION_LOAN_INTEREST',
  section131: 'SECTION_131_AFFORDABLE_HOUSING_LOAN_INTEREST',
  section132: 'SECTION_132_ELECTRIC_VEHICLE_LOAN_INTEREST',
  section133: 'SECTION_133_DONATIONS_TO_CHARITY',
  hraAndOtherExemptions: 'HRA_AND_OTHER_EXEMPTIONS'
};

const EmployeeTaxDeclaration = () => {
  const [declarations, setDeclarations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [deductionLimits, setDeductionLimits] = useState([]);
  const [employeeRegimes, setEmployeeRegimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [regimeWarning, setRegimeWarning] = useState('');

  // Clean initial state — NO hardcoded limits
  const [formData, setFormData] = useState({
    employeeId: '',
    financialYearId: '',
    ageCategory: 'LESS_THAN_60',
    deductionTypes: {
      rentalIncomeReceived: 0,
      municipalTaxPaid: 0,
      housingLoanInterestLetOut: 0,
      otherIncome: 0
    },
    exemptionDetails: {
      hraAndOtherExemptions: 0,
      hraCalculation: {
        basicPayReceivedPA: 0,
        dearnessAllowanceReceivedPA: 0,
        houseRentAllowanceReceivedPA: 0,
        totalRentPaid: 0,
        metroCity: false
      },
      interestPaidOnHousingLoan: { amount: 0 },
      section123: { amount: 0 },
      section124: { amount: 0 },
      section124_1B: { amount: 0 },
      section126: { amount: 0 },
      section129: { amount: 0 },
      section131: { amount: 0 },
      section132: { amount: 0 },
      section133: { amount: 0 }
    }
  });

  useEffect(() => {
    loadData();
    loadEmployees();
    loadFinancialYears();
    loadEmployeeRegimes();
    loadDeductionLimits();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await employeeTaxDeclarationService.getEmployeeTaxDeclarations();
      setDeclarations(data.data || []);
    } catch (error) {
      console.error('Error loading declarations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data?.employees || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadFinancialYears = async () => {
    try {
      const data = await financialYearService.getFinancialYears();
      setFinancialYears(data.data || []);
    } catch (error) {
      console.error('Error loading FY:', error);
    }
  };

  const loadDeductionLimits = async () => {
    try {
      const data = await deductionLimitService.getDeductionLimits();
      setDeductionLimits(data.data || []);
    } catch (error) {
      console.error('Error loading deduction limits:', error);
    }
  };

  const loadEmployeeRegimes = async () => {
    try {
      const data = await employeeTaxRegimeService.getEmployeeRegimes();
      setEmployeeRegimes(data.data || []);
    } catch (error) {
      console.error('Error loading employee regimes:', error);
    }
  };

  // Get dynamic limit from DeductionLimitManagement for a given section & FY
  const getLimitForSection = (sectionKey, fyId) => {
    if (!fyId || !deductionLimits.length) return 0;
    const type = DEDUCTION_TYPE_MAP[sectionKey];
    const limit = deductionLimits.find(l => {
      const limitFyId = l.financialYearId?._id || l.financialYearId;
      const matchesType = l.deductionType === type;
      const matchesFY = limitFyId === fyId;
      const matchesRegime = l.regime === 'OLD';
      return matchesType && matchesFY && matchesRegime;
    });
    return limit ? limit.maximumAmount : 0;
  };

  const getEmployeeRegime = (empId, fyId) => {
    return employeeRegimes.find(
      r => r.employeeId === empId &&
        (r.financialYearId?._id || r.financialYearId) === fyId
    );
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'employeeId' && value && prev.financialYearId) {
      const regime = getEmployeeRegime(value, prev.financialYearId);
      if (regime && regime.regime === 'NEW') {
        setRegimeWarning('This employee is on NEW regime. Tax declarations are not applicable.');
      } else {
        setRegimeWarning('');
      }
    }
  };

  const handleDeductionTypeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deductionTypes: { ...prev.deductionTypes, [field]: parseFloat(value) || 0 }
    }));
  };

  const handleExemptionChange = (section, value) => {
    const limit = getLimitForSection(section, formData.financialYearId);
    let numVal = parseFloat(value) || 0;
    // Optional: auto-cap at limit if limit exists
    if (limit > 0 && numVal > limit) numVal = limit;
    setFormData(prev => ({
      ...prev,
      exemptionDetails: {
        ...prev.exemptionDetails,
        [section]: { ...prev.exemptionDetails[section], amount: numVal }
      }
    }));
  };

  const handleHraCalcChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      exemptionDetails: {
        ...prev.exemptionDetails,
        hraCalculation: { ...prev.exemptionDetails.hraCalculation, [field]: field === 'metroCity' ? value : (parseFloat(value) || 0) }
      }
    }));
  };

  const handleSimpleExemptionChange = (section, value) => {
    const limit = getLimitForSection(section, formData.financialYearId);
    let numVal = parseFloat(value) || 0;
    // Optional: auto-cap at limit if limit exists
    if (limit > 0 && numVal > limit) numVal = limit;
    setFormData(prev => ({
      ...prev,
      exemptionDetails: { ...prev.exemptionDetails, [section]: numVal }
    }));
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      financialYearId: financialYears[0]?._id || '',
      ageCategory: 'LESS_THAN_60',
      deductionTypes: {
        rentalIncomeReceived: 0,
        municipalTaxPaid: 0,
        housingLoanInterestLetOut: 0,
        otherIncome: 0
      },
      exemptionDetails: {
        hraAndOtherExemptions: 0,
        hraCalculation: {
          basicPayReceivedPA: 0,
          dearnessAllowanceReceivedPA: 0,
          houseRentAllowanceReceivedPA: 0,
          totalRentPaid: 0,
          metroCity: false
        },
        interestPaidOnHousingLoan: { amount: 0 },
        section123: { amount: 0 },
        section124: { amount: 0 },
        section124_1B: { amount: 0 },
        section126: { amount: 0 },
        section129: { amount: 0 },
        section131: { amount: 0 },
        section132: { amount: 0 },
        section133: { amount: 0 }
      }
    });
    setEditingItem(null);
    setRegimeWarning('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block NEW regime employees
    const regimeInfo = getEmployeeRegime(formData.employeeId, formData.financialYearId);
    if (regimeInfo && regimeInfo.regime === 'NEW') {
      alert('Cannot create tax declaration for NEW regime employees. NEW regime does not support exemptions/deductions.');
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        await employeeTaxDeclarationService.updateEmployeeTaxDeclaration(editingItem._id, formData);
        alert('Tax declaration updated successfully!');
      } else {
        await employeeTaxDeclarationService.createEmployeeTaxDeclaration(formData);
        alert('Tax declaration created successfully!');
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving tax declaration');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    const fyId = item.financialYearId?._id || item.financialYearId;
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId,
      financialYearId: fyId,
      ageCategory: item.ageCategory,
      deductionTypes: { ...item.deductionTypes },
      exemptionDetails: {
        hraAndOtherExemptions: item.exemptionDetails?.hraAndOtherExemptions || 0,
        hraCalculation: { ...item.exemptionDetails?.hraCalculation } || {
          basicPayReceivedPA: 0,
          dearnessAllowanceReceivedPA: 0,
          houseRentAllowanceReceivedPA: 0,
          totalRentPaid: 0,
          metroCity: false
        },
        interestPaidOnHousingLoan: { amount: item.exemptionDetails?.interestPaidOnHousingLoan?.amount || 0 },
        section123: { amount: item.exemptionDetails?.section123?.amount || 0 },
        section124: { amount: item.exemptionDetails?.section124?.amount || 0 },
        section124_1B: { amount: item.exemptionDetails?.section124_1B?.amount || 0 },
        section126: { amount: item.exemptionDetails?.section126?.amount || 0 },
        section129: { amount: (typeof item.exemptionDetails?.section129 === 'object' ? item.exemptionDetails?.section129?.amount : item.exemptionDetails?.section129) || 0 },
        section131: { amount: item.exemptionDetails?.section131?.amount || 0 },
        section132: { amount: item.exemptionDetails?.section132?.amount || 0 },
        section133: { amount: (typeof item.exemptionDetails?.section133 === 'object' ? item.exemptionDetails?.section133?.amount : item.exemptionDetails?.section133) || 0 }
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this declaration?')) {
      try {
        await employeeTaxDeclarationService.deleteEmployeeTaxDeclaration(id);
        alert('Declaration deleted successfully!');
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting declaration');
      }
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.employeeId === empId || e._id === empId);
    return emp ? `${emp.name} (${emp.employeeId})` : empId;
  };

  const getFYName = (fyId) => {
    const fy = financialYears.find(f => f._id === (fyId?._id || fyId));
    return fy ? fy.name : 'Unknown';
  };

  const getAgeLabel = (cat) => AGE_CATEGORIES.find(a => a.value === cat)?.label || cat;

  const filteredData = declarations.filter(d => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return getEmployeeName(d.employeeId).toLowerCase().includes(term) || getFYName(d.financialYearId).toLowerCase().includes(term);
  });

  const renderNumberInput = (label, value, onChange, placeholder = '0', helpText = null) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type="number" value={value} onChange={onChange} placeholder={placeholder} min="0" />
      {helpText && <small className="form-help">{helpText}</small>}
    </div>
  );

  return (
    <div className="income-tax-management">
      <div className="tax-header">
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{declarations.length}</div>
            <div className="stat-label">Total Declarations</div>
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-container">
          <input type="text" placeholder="Search by employee or FY..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="controls-btns">
          <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <span>+</span> Add Declaration
          </button>
        </div>
      </div>

      <div className="tax-table-container">
        {loading ? (
          <div className="table-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-row loading-shimmer" style={{height: '60px'}}></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="no-records">
            <h3>No declarations found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'No tax declarations available'}</p>
          </div>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Financial Year</th>
                <th>Age Category</th>
                <th>Total Exemptions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(d => {
                const totalExemptions = Object.values(d.exemptionDetails || {}).reduce((sum, val) => {
                  if (typeof val === 'number') return sum + val;
                  if (val && typeof val === 'object' && val.amount) return sum + val.amount;
                  return sum;
                }, 0);
                return (
                  <tr key={d._id}>
                    <td><strong>{getEmployeeName(d.employeeId)}</strong></td>
                    <td>{getFYName(d.financialYearId)}</td>
                    <td>{getAgeLabel(d.ageCategory)}</td>
                    <td>₹{totalExemptions.toLocaleString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btns primary" onClick={() => handleEdit(d)} title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button className="action-btns danger" onClick={() => handleDelete(d._id)} title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modals-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content xlarge-modals" onClick={e => e.stopPropagation()}>
            <div className="modals-header">
              <h3>{editingItem ? 'Edit Tax Declaration' : 'Add Tax Declaration'}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modals-body">
              {regimeWarning && (
                <div style={{padding: '16px 32px 0', color: '#92400e', background: '#fffbeb', borderBottom: '1px solid #fcd34d', fontWeight: 600}}>
                  ⚠ {regimeWarning}
                </div>
              )}
              <form onSubmit={handleSubmit} className="form-sections">
                {/* Basic Info */}
                <div className="form-section">
                  <h4 className="section-title">Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Employee *</label>
                      <select className="form-select" name="employeeId" value={formData.employeeId} onChange={handleBasicChange} required>
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp.employeeId}>{emp.name} ({emp.employeeId})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Financial Year *</label>
                      <select className="form-select" name="financialYearId" value={formData.financialYearId} onChange={handleBasicChange} required>
                        <option value="">Select Financial Year</option>
                        {financialYears.map(fy => (
                          <option key={fy._id} value={fy._id}>{fy.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Age Category *</label>
                      <select className="form-select" name="ageCategory" value={formData.ageCategory} onChange={handleBasicChange} required>
                        {AGE_CATEGORIES.map(ac => (
                          <option key={ac.value} value={ac.value}>{ac.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Other Income / Deduction Types */}
                <div className="form-section">
                  <h4 className="section-title">Other Income & Deductions</h4>
                  <div className="form-grid">
                    {renderNumberInput('Rental Income Received (₹)', formData.deductionTypes.rentalIncomeReceived, e => handleDeductionTypeChange('rentalIncomeReceived', e.target.value))}
                    {renderNumberInput('Municipal Tax Paid (₹)', formData.deductionTypes.municipalTaxPaid, e => handleDeductionTypeChange('municipalTaxPaid', e.target.value))}
                    {renderNumberInput('Housing Loan Interest (Let Out) (₹)', formData.deductionTypes.housingLoanInterestLetOut, e => handleDeductionTypeChange('housingLoanInterestLetOut', e.target.value))}
                    {renderNumberInput('Other Income (₹)', formData.deductionTypes.otherIncome, e => handleDeductionTypeChange('otherIncome', e.target.value))}
                  </div>
                </div>

                {/* HRA Exemption */}
                <div className="form-section">
                  <h4 className="section-title">HRA & Exemptions</h4>
                  <div className="form-grid">
                    {renderNumberInput(
                      'HRA & Other Exemptions (₹)',
                      formData.exemptionDetails.hraAndOtherExemptions,
                      e => handleSimpleExemptionChange('hraAndOtherExemptions', e.target.value),
                      '0',
                      `Limit: ₹${getLimitForSection('hraAndOtherExemptions', formData.financialYearId).toLocaleString()}`
                    )}
                  </div>
                  <div style={{marginTop: '16px'}}>
                    <h5 style={{marginBottom: '12px', color: '#374151', fontSize: '14px'}}>HRA Calculation Details</h5>
                    <div className="form-grid">
                      {renderNumberInput('Basic Pay Received (PA) (₹)', formData.exemptionDetails.hraCalculation.basicPayReceivedPA, e => handleHraCalcChange('basicPayReceivedPA', e.target.value))}
                      {renderNumberInput('Dearness Allowance (PA) (₹)', formData.exemptionDetails.hraCalculation.dearnessAllowanceReceivedPA, e => handleHraCalcChange('dearnessAllowanceReceivedPA', e.target.value))}
                      {renderNumberInput('HRA Received (PA) (₹)', formData.exemptionDetails.hraCalculation.houseRentAllowanceReceivedPA, e => handleHraCalcChange('houseRentAllowanceReceivedPA', e.target.value))}
                      {renderNumberInput('Total Rent Paid (₹)', formData.exemptionDetails.hraCalculation.totalRentPaid, e => handleHraCalcChange('totalRentPaid', e.target.value))}
                      <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px'}}>
                        <input type="checkbox" id="metroCity" checked={formData.exemptionDetails.hraCalculation.metroCity} onChange={e => handleHraCalcChange('metroCity', e.target.checked)} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                        <label htmlFor="metroCity" className="form-label" style={{margin: 0, cursor: 'pointer'}}>Metro City (50% calc)</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Deductions */}
                <div className="form-section">
                  <h4 className="section-title">Section Deductions</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Interest on Housing Loan (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.interestPaidOnHousingLoan.amount} onChange={e => handleExemptionChange('interestPaidOnHousingLoan', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('interestPaidOnHousingLoan', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 123 - PF/PPF/Insurance (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section123.amount} onChange={e => handleExemptionChange('section123', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section123', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 124 - NPS Contribution (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section124.amount} onChange={e => handleExemptionChange('section124', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section124', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 124(1B) - Addl NPS (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section124_1B.amount} onChange={e => handleExemptionChange('section124_1B', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section124_1B', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 126 - Medical Insurance (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section126.amount} onChange={e => handleExemptionChange('section126', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section126', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 129 - Education Loan Interest (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section129.amount} onChange={e => handleExemptionChange('section129', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section129', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 131 - Affordable Housing (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section131.amount} onChange={e => handleExemptionChange('section131', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section131', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 132 - EV Loan Interest (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section132.amount} onChange={e => handleExemptionChange('section132', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section132', formData.financialYearId).toLocaleString()}</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section 133 - Donations (₹)</label>
                      <input className="form-input" type="number" value={formData.exemptionDetails.section133.amount} onChange={e => handleExemptionChange('section133', e.target.value)} min="0" />
                      <small className="form-help">Limit: ₹{getLimitForSection('section133', formData.financialYearId).toLocaleString()}</small>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="action-btns" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="action-btns primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingItem ? 'Update Declaration' : 'Create Declaration')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTaxDeclaration;