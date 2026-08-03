import React, { useState, useEffect } from 'react';
import { deductionLimitService } from '../../services/deductionLimitService';
import { financialYearService } from '../../services/financialYearService';
import api from '../../services/api';
import './IncomeTax.css';

const DEDUCTION_TYPES = [
  { value: 'INTEREST_PAID_ON_HOUSING_LOAN', label: 'Interest on Housing Loan' },
  { value: 'SECTION_123_PF_PPF_INSURANCE_PREMIUM', label: 'Sec 123 - PF/PPF/Insurance' },
  { value: 'SECTION_124_EMPLOYEE_NPS_CONTRIBUTION', label: 'Sec 124 - NPS Contribution' },
  { value: 'SECTION_124_1B_ADDITIONAL_NPS_CONTRIBUTION', label: 'Sec 124(1B) - Additional NPS' },
  { value: 'SECTION_126_MEDICAL_INSURANCE_PREMIUM', label: 'Sec 126 - Medical Insurance' },
  { value: 'SECTION_129_EDUCATION_LOAN_INTEREST', label: 'Sec 129 - Education Loan Interest' },
  { value: 'SECTION_131_AFFORDABLE_HOUSING_LOAN_INTEREST', label: 'Sec 131 - Affordable Housing Loan' },
  { value: 'SECTION_132_ELECTRIC_VEHICLE_LOAN_INTEREST', label: 'Sec 132 - EV Loan Interest' },
  { value: 'SECTION_133_DONATIONS_TO_CHARITY', label: 'Sec 133 - Donations' },
  { value: 'HRA_AND_OTHER_EXEMPTIONS', label: 'HRA & Other Exemptions' }
];

const DeductionLimitManagement = () => {
  const [limits, setLimits] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    financialYearId: '',
    regime: 'OLD',
    deductionType: '',
    maximumAmount: 0,
    active: true
  });

  useEffect(() => {
    loadData();
    loadFinancialYears();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await deductionLimitService.getDeductionLimits();
      setLimits(data.data || []);
    } catch (error) {
      console.error('Error loading deduction limits:', error);
      alert('Error loading deduction limits');
    } finally {
      setLoading(false);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const resetForm = () => {
    setFormData({
      financialYearId: financialYears[0]?._id || '',
      regime: 'OLD',
      deductionType: '',
      maximumAmount: 0,
      active: true
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await deductionLimitService.updateDeductionLimit(editingItem._id, formData);
        alert('Deduction limit updated successfully!');
      } else {
        await deductionLimitService.createDeductionLimit(formData);
        alert('Deduction limit created successfully!');
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving deduction limit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      financialYearId: item.financialYearId?._id || item.financialYearId,
      regime: item.regime,
      deductionType: item.deductionType,
      maximumAmount: item.maximumAmount,
      active: item.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deduction limit?')) {
      try {
        await deductionLimitService.deleteDeductionLimit(id);
        alert('Deduction limit deleted successfully!');
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting deduction limit');
      }
    }
  };

  const getFYName = (fyId) => {
    const fy = financialYears.find(f => f._id === (fyId?._id || fyId));
    return fy ? fy.name : 'Unknown';
  };

  const getDeductionLabel = (type) => {
    const dt = DEDUCTION_TYPES.find(d => d.value === type);
    return dt ? dt.label : type;
  };

  const filteredData = limits.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return getDeductionLabel(l.deductionType).toLowerCase().includes(term) || l.regime.toLowerCase().includes(term);
  });

  return (
    <div className="income-tax-management">
        <div className="controls-btns">
          <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <span>+</span> Add Deduction Limit
          </button>
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
            <h3>No deduction limits found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'No deduction limits available'}</p>
          </div>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>Financial Year</th>
                <th>Regime</th>
                <th>Deduction Type</th>
                <th>Maximum Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(l => (
                <tr key={l._id}>
                  <td>{getFYName(l.financialYearId)}</td>
                  <td>
                    <span className={`status-badge ${l.regime === 'OLD' ? 'status-old' : l.regime === 'NEW' ? 'status-new' : 'status-active'}`}>
                      {l.regime}
                    </span>
                  </td>
                  <td>{getDeductionLabel(l.deductionType)}</td>
                  <td>₹{l.maximumAmount?.toLocaleString()}</td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btns primary" onClick={() => handleEdit(l)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="action-btns danger" onClick={() => handleDelete(l._id)} title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modals-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content large-modals" onClick={e => e.stopPropagation()}>
            <div className="modals-header">
              <h3>{editingItem ? 'Edit Deduction Limit' : 'Add Deduction Limit'}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modals-body">
              <form onSubmit={handleSubmit} className="form-sections">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Financial Year *</label>
                      <select className="form-select" name="financialYearId" value={formData.financialYearId} onChange={handleInputChange} required>
                        <option value="">Select Financial Year</option>
                        {financialYears.map(fy => (
                          <option key={fy._id} value={fy._id}>{fy.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Regime *</label>
                      <select className="form-select" name="regime" value={formData.regime} onChange={handleInputChange} required>
                        <option value="OLD">OLD</option>
                        <option value="NEW">NEW</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Deduction Type *</label>
                      <select className="form-select" name="deductionType" value={formData.deductionType} onChange={handleInputChange} required>
                        <option value="">Select Type</option>
                        {DEDUCTION_TYPES.map(dt => (
                          <option key={dt.value} value={dt.value}>{dt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Maximum Amount (₹) *</label>
                      <input className="form-input" type="number" name="maximumAmount" value={formData.maximumAmount} onChange={handleInputChange} min="0" required />
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="action-btns" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="action-btns primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
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

export default DeductionLimitManagement;
