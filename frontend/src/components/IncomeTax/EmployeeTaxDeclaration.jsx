import React, { useState, useEffect, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState('SUBMITTED'); // SUBMITTED | APPROVED | REJECTED
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    financialYearId: '',
    ageCategory: 'LESS_THAN_60',
    deductionTypes: {
      interestFromSavingsOrFD: 0,
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
      const data = await employeeTaxDeclarationService.getDeclarationsByStatus(activeTab);
      setDeclarations(data.data || []);
    } catch (error) {
      console.error('Error loading declarations:', error);
    } finally {
      setLoading(false);
    }
  };
    useEffect(() => {
    loadData();
  }, [activeTab]);

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

  const getLimitForSection = (sectionKey, fyId) => {
    if (!fyId || !deductionLimits.length) return 0;
    const type = DEDUCTION_TYPE_MAP[sectionKey];
    const limit = deductionLimits.find(l => {
      const limitFyId = l.financialYearId?._id || l.financialYearId;
      const matchesType = l.deductionType === type;
      const matchesFY = limitFyId === fyId;
      const matchesRegime = l.regime === 'OLD' || l.regime === 'BOTH';
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

  // Live HRA Calculation
  const hraCalc = formData.exemptionDetails.hraCalculation;
  const hraComputed = useMemo(() => {
    const basic = parseFloat(hraCalc.basicPayReceivedPA) || 0;
    const da = parseFloat(hraCalc.dearnessAllowanceReceivedPA) || 0;
    const hraReceived = parseFloat(hraCalc.houseRentAllowanceReceivedPA) || 0;
    const rentPaid = parseFloat(hraCalc.totalRentPaid) || 0;
    const metro = hraCalc.metroCity;

    const salary = basic + da;
    const a = Math.max(0, rentPaid - (salary * 0.10));
    const b = basic * (metro ? 0.50 : 0.40);
    const c = hraReceived;
    const exempted = Math.max(0, Math.min(a, b, c));
    const taxable = Math.max(0, hraReceived - exempted);

    return {
      a: Math.round(a),
      b: Math.round(b),
      c: Math.round(c),
      exempted: Math.round(exempted),
      taxable: Math.round(taxable),
      metroPercent: metro ? '50%' : '40%'
    };
  }, [hraCalc.basicPayReceivedPA, hraCalc.dearnessAllowanceReceivedPA, hraCalc.houseRentAllowanceReceivedPA, hraCalc.totalRentPaid, hraCalc.metroCity]);

  // Auto-insert exempted HRA into hraAndOtherExemptions whenever HRA inputs change
  useEffect(() => {
    if (showForm) {
      setFormData(prev => ({
        ...prev,
        exemptionDetails: {
          ...prev.exemptionDetails,
          hraAndOtherExemptions: hraComputed.exempted
        }
      }));
    }
  }, [hraComputed.exempted, showForm]);

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
    if (limit > 0 && numVal > limit) numVal = limit;
    setFormData(prev => ({
      ...prev,
      exemptionDetails: { ...prev.exemptionDetails, [section]: numVal }
    }));
  };

  const handleApprove = async (id) => {
  if (!window.confirm('Approve this declaration?')) return;
  try {
    await employeeTaxDeclarationService.approveDeclaration(id);
    alert('Declaration approved!');
    loadData();
  } catch (error) {
    alert(error.response?.data?.message || 'Error approving');
  }
};

const handleReject = async () => {
  if (!rejectionReason.trim()) {
    alert('Please enter a rejection reason');
    return;
  }
  try {
    await employeeTaxDeclarationService.rejectDeclaration(reviewItem._id, rejectionReason);
    alert('Declaration rejected!');
    setReviewModal(false);
    setRejectionReason('');
    setReviewItem(null);
    loadData();
  } catch (error) {
    alert(error.response?.data?.message || 'Error rejecting');
  }
};

const openReview = (item) => {
  setReviewItem(item);
  setRejectionReason('');
  setReviewModal(true);
};

  const resetForm = () => {
    setFormData({
      employeeId: '',
      financialYearId: financialYears[0]?._id || '',
      ageCategory: 'LESS_THAN_60',
      deductionTypes: {
        interestFromSavingsOrFD: 0,
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

  const renderNumberInput = (label, value, onChange, placeholder = '0', helpText = null, required = false) => (
    <div className="form-group">
      <label className="form-label">{label}{required && <span style={{color: '#ef4444'}}> *</span>}</label>
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
        <div className="controls-buttons">
          <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <span>+</span> Add Declaration
          </button>
        </div>
      </div>

<div style={{display: 'flex', gap: '12px', marginBottom: '20px'}}>
  {['SUBMITTED', 'APPROVED', 'REJECTED'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '10px 24px',
        borderRadius: '10px',
        border: 'none',
        fontWeight: 700,
        cursor: 'pointer',
        background: activeTab === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
        color: activeTab === tab ? 'white' : '#374151',
        transition: 'all 0.3s'
      }}
    >
      {tab} ({declarations.length})
    </button>
  ))}
</div>

{/* Table */}
<table className="tax-table">
  <thead>
    <tr>
      <th>Employee</th>
      <th>Financial Year</th>
      <th>Age Category</th>
      <th>Submitted At</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {filteredData.map(d => (
      <tr key={d._id}>
        <td><strong>{getEmployeeName(d.employeeId)}</strong></td>
        <td>{getFYName(d.financialYearId)}</td>
        <td>{getAgeLabel(d.ageCategory)}</td>
        <td>{d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : '-'}</td>
        <td>
          <span className={`status-badge ${
            d.declarationStatus === 'APPROVED' ? 'status-active' : 
            d.declarationStatus === 'REJECTED' ? 'status-inactive' : 
            d.declarationStatus === 'SUBMITTED' ? 'status-old' : 'status-inactive'
          }`}>
            {d.declarationStatus}
          </span>
        </td>
        <td>
          <div className="table-actions">
            <button className="action-btns primary" onClick={() => openReview(d)} title="Review">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            {d.declarationStatus === 'SUBMITTED' && (
              <>
                <button className="action-btns success" onClick={() => handleApprove(d._id)} title="Approve">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button className="action-btns danger" onClick={() => openReview(d)} title="Reject">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>

{/* Review Modal */}
{reviewModal && reviewItem && (
  <div className="modals-overlay" onClick={() => setReviewModal(false)}>
    <div className="modal-content xlarge-modals" onClick={e => e.stopPropagation()}>
      <div className="modals-header">
        <h3>Review Declaration — {getEmployeeName(reviewItem.employeeId)}</h3>
        <button className="close-btn" onClick={() => setReviewModal(false)}>×</button>
      </div>
      <div className="modals-body">
        <div className="form-sections">
          <div className="form-section">
            <h4 className="section-title">Declaration Details</h4>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">Age:</span><span className="detail-value">{getAgeLabel(reviewItem.ageCategory)}</span></div>
              <div className="detail-item"><span className="detail-label">Other Income:</span><span className="detail-value">₹{reviewItem.deductionTypes?.otherIncome || 0}</span></div>
              <div className="detail-item"><span className="detail-label">HRA Exemption:</span><span className="detail-value">₹{reviewItem.exemptionDetails?.hraAndOtherExemptions || 0}</span></div>
              <div className="detail-item"><span className="detail-label">Sec 123:</span><span className="detail-value">₹{reviewItem.exemptionDetails?.section123?.amount || 0}</span></div>
              <div className="detail-item"><span className="detail-label">Sec 124:</span><span className="detail-value">₹{reviewItem.exemptionDetails?.section124?.amount || 0}</span></div>
              <div className="detail-item"><span className="detail-label">Sec 126:</span><span className="detail-value">₹{reviewItem.exemptionDetails?.section126?.amount || 0}</span></div>
            </div>
          </div>

          {reviewItem.declarationStatus === 'SUBMITTED' && (
            <div className="form-section">
              <h4 className="section-title">Admin Action</h4>
              <div className="form-group">
                <label className="form-label">Rejection Reason (required only for reject)</label>
                <textarea 
                  className="form-textarea" 
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter reason if rejecting..."
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="action-btns success" onClick={() => handleApprove(reviewItem._id)}>
                  ✅ Approve Declaration
                </button>
                <button type="button" className="action-btns danger" onClick={handleReject}>
                  ❌ Reject Declaration
                </button>
              </div>
            </div>
          )}

          {reviewItem.declarationStatus === 'REJECTED' && (
            <div style={{padding: '16px', background: '#fef2f2', borderRadius: '12px', color: '#991b1b'}}>
              <strong>Rejection Reason:</strong>
              <p style={{margin: '8px 0 0 0'}}>{reviewItem.rejectionReason}</p>
            </div>
          )}

          {reviewItem.declarationStatus === 'APPROVED' && (
            <div style={{padding: '16px', background: '#ecfdf5', borderRadius: '12px', color: '#065f46'}}>
              <strong>Approved by Admin</strong>
              <p style={{margin: '8px 0 0 0'}}>Reviewed on: {new Date(reviewItem.reviewedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

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
                    {renderNumberInput('Interest from Savings/FD (₹)', formData.deductionTypes.interestFromSavingsOrFD, e => handleDeductionTypeChange('interestFromSavingsOrFD', e.target.value))}
                    {renderNumberInput('Rental Income Received (₹)', formData.deductionTypes.rentalIncomeReceived, e => handleDeductionTypeChange('rentalIncomeReceived', e.target.value))}
                    {renderNumberInput('Municipal Tax Paid (₹)', formData.deductionTypes.municipalTaxPaid, e => handleDeductionTypeChange('municipalTaxPaid', e.target.value))}
                    {renderNumberInput('Housing Loan Interest (Let Out) (₹)', formData.deductionTypes.housingLoanInterestLetOut, e => handleDeductionTypeChange('housingLoanInterestLetOut', e.target.value))}
                    {renderNumberInput('Other Income (₹)', formData.deductionTypes.otherIncome, e => handleDeductionTypeChange('otherIncome', e.target.value))}
                  </div>
                </div>

                {/* HRA Calculator */}
                <div className="form-section">
                  <h4 className="section-title">HRA Calculator</h4>
                  <div className="form-grid">
                    {renderNumberInput('Basic Pay (received p.a)', formData.exemptionDetails.hraCalculation.basicPayReceivedPA, e => handleHraCalcChange('basicPayReceivedPA', e.target.value), '0', null, true)}
                    {renderNumberInput('Dearness Allowance (received p.a)', formData.exemptionDetails.hraCalculation.dearnessAllowanceReceivedPA, e => handleHraCalcChange('dearnessAllowanceReceivedPA', e.target.value))}
                    {renderNumberInput('House Rent Allowance (received p.a)', formData.exemptionDetails.hraCalculation.houseRentAllowanceReceivedPA, e => handleHraCalcChange('houseRentAllowanceReceivedPA', e.target.value), '0', null, true)}
                    {renderNumberInput('Total Rent Paid', formData.exemptionDetails.hraCalculation.totalRentPaid, e => handleHraCalcChange('totalRentPaid', e.target.value), '0', null, true)}
                  </div>

                  {/* Metro City Toggle */}
                  <div style={{marginTop: '20px'}}>
                    <label style={{fontSize: '14px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px'}}>
                      Do you live in a metro city? (Mumbai, Kolkata, Delhi, Chennai, Hyderabad, Pune, Ahmedabad, or Bengaluru)
                    </label>
                    <div style={{display: 'inline-flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid #d1d5db'}}>
                      <button
                        type="button"
                        onClick={() => handleHraCalcChange('metroCity', true)}
                        style={{
                          padding: '10px 28px',
                          border: 'none',
                          background: hraCalc.metroCity ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                          color: hraCalc.metroCity ? 'white' : '#374151',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHraCalcChange('metroCity', false)}
                        style={{
                          padding: '10px 28px',
                          border: 'none',
                          background: !hraCalc.metroCity ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                          color: !hraCalc.metroCity ? 'white' : '#374151',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          borderLeft: '1px solid #d1d5db'
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* HRA Calculation Breakdown */}
                  <div style={{background: '#f1f5f9', padding: '24px', borderRadius: '12px', marginTop: '24px', border: '1px solid #e2e8f0'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #cbd5e1'}}>
                      <span style={{color: '#475569', fontSize: '14px'}}>(A) Rent paid in excess of 10% of salary</span>
                      <span style={{fontWeight: 600, color: '#1e293b', fontFamily: "'Courier New', monospace"}}>₹ {hraComputed.a.toLocaleString()}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #cbd5e1'}}>
                      <span style={{color: '#475569', fontSize: '14px'}}>(B) {hraComputed.metroPercent} of basic pay</span>
                      <span style={{fontWeight: 600, color: '#1e293b', fontFamily: "'Courier New', monospace"}}>₹ {hraComputed.b.toLocaleString()}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #cbd5e1'}}>
                      <span style={{color: '#475569', fontSize: '14px'}}>(C) HRA provided by the employer</span>
                      <span style={{fontWeight: 600, color: '#1e293b', fontFamily: "'Courier New', monospace"}}>₹ {hraComputed.c.toLocaleString()}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 12px', marginTop: '4px', borderTop: '2px solid #334155'}}>
                      <span style={{fontWeight: 700, color: '#1e293b', fontSize: '15px'}}>Amount of HRA exempted</span>
                      <span style={{fontWeight: 700, color: '#059669', fontSize: '18px', fontFamily: "'Courier New', monospace"}}>₹ {hraComputed.exempted.toLocaleString()}</span>
                    </div>
                    <div style={{fontSize: '12px', color: '#64748b', marginBottom: '8px'}}>The least of A, B, and C is exempted from tax</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0', borderTop: '1px dashed #94a3b8'}}>
                      <span style={{fontWeight: 600, color: '#475569'}}>HRA chargeable to tax</span>
                      <span style={{fontWeight: 600, color: '#dc2626', fontFamily: "'Courier New', monospace"}}>₹ {hraComputed.taxable.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Auto-populated HRA Exemption Field */}
                  <div style={{marginTop: '20px'}}>
                    {renderNumberInput(
                      'HRA & Other Exemptions (₹) — Auto calculated from above',
                      formData.exemptionDetails.hraAndOtherExemptions,
                      e => handleSimpleExemptionChange('hraAndOtherExemptions', e.target.value),
                      '0',
                      `Limit: ₹${getLimitForSection('hraAndOtherExemptions', formData.financialYearId).toLocaleString()}`
                    )}
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