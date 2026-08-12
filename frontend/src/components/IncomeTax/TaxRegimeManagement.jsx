import React, { useState, useEffect } from 'react';
import { taxRegimeService } from '../../services/taxRegimeService';
import { financialYearService } from '../../services/financialYearService';
import './IncomeTax.css';

const TaxRegimeManagement = () => {
  const [regimes, setRegimes] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    financialYearId: '',
    regime: 'NEW',
    standardDeduction: 0,
    rebateAmount: 0,
    rebateLimit: 0,
    cessPercentage: 4,
    active: true
  });

  useEffect(() => {
    loadData();
    loadFinancialYears();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await taxRegimeService.getTaxRegimes();
      setRegimes(data.data || []);
    } catch (error) {
      console.error('Error loading tax regimes:', error);
      alert('Error loading tax regimes');
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialYears = async () => {
    try {
      const data = await financialYearService.getFinancialYears();
      setFinancialYears(data.data || []);
    } catch (error) {
      console.error('Error loading financial years:', error);
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
      regime: 'NEW',
      standardDeduction: 0,
      rebateAmount: 0,
      rebateLimit: 0,
      cessPercentage: 4,
      active: true
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await taxRegimeService.updateTaxRegime(editingItem._id, formData);
        alert('Tax regime updated successfully!');
      } else {
        await taxRegimeService.createTaxRegime(formData);
        alert('Tax regime created successfully!');
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving tax regime');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      financialYearId: item.financialYearId?._id || item.financialYearId,
      regime: item.regime,
      standardDeduction: item.standardDeduction || 0,
      rebateAmount: item.rebateAmount || 0,
      rebateLimit: item.rebateLimit || 0,
      cessPercentage: item.cessPercentage || 4,
      active: item.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax regime?')) {
      try {
        await taxRegimeService.deleteTaxRegime(id);
        alert('Tax regime deleted successfully!');
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting tax regime');
      }
    }
  };

  const getFYName = (fyId) => {
    const fy = financialYears.find(f => f._id === (fyId?._id || fyId));
    return fy ? fy.name : 'Unknown';
  };

  const filteredData = regimes.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (r.regime && r.regime.toLowerCase().includes(term)) || getFYName(r.financialYearId).toLowerCase().includes(term);
  });

  return (
    <div className="income-tax-management">
        <div className="controls-btns">
          <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <span>+</span> Add Tax Regime
          </button>
        </div>
      {/* </div> */}

      <div className="tax-table-container">
        {loading ? (
          <div className="table-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-row loading-shimmer" style={{height: '60px'}}></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="no-records">
            <h3>No tax regimes found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'No tax regimes available'}</p>
          </div>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>Financial Year</th>
                <th>Regime</th>
                <th>Std. Deduction</th>
                <th>Rebate</th>
                <th>Cess %</th>
                {/* <th>Status</th> */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(r => (
                <tr key={r._id}>
                  <td>{getFYName(r.financialYearId)}</td>
                  <td>
                    <span className={`status-badge status-${r.regime.toLowerCase()}`}>{r.regime}</span>
                  </td>
                  <td>₹{r.standardDeduction?.toLocaleString()}</td>
                  <td>₹{r.rebateAmount?.toLocaleString()} (≤₹{r.rebateLimit?.toLocaleString()})</td>
                  <td>{r.cessPercentage}%</td>
                  {/* <td>
                    <span className={`status-badge ${r.active ? 'status-active' : 'status-inactive'}`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td> */}
                  <td>
                    <div className="table-actions">
                      <button className="action-btns primary" onClick={() => handleEdit(r)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="action-btns danger" onClick={() => handleDelete(r._id)} title="Delete">
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
              <h3>{editingItem ? 'Edit Tax Regime' : 'Add Tax Regime'}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modals-body">
              <form onSubmit={handleSubmit} className="form-sections">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-row">
                      <label className="form-label">Financial Year *</label>
                      <select className="form-select" name="financialYearId" value={formData.financialYearId} onChange={handleInputChange} required>
                        <option value="">Select Financial Year</option>
                        {financialYears.map(fy => (
                          <option key={fy._id} value={fy._id}>{fy.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label className="form-label">Regime *</label>
                      <select className="form-select" name="regime" value={formData.regime} onChange={handleInputChange} required>
                        <option value="OLD">OLD</option>
                        <option value="NEW">NEW</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label className="form-label">Standard Deduction (₹)</label>
                      <input className="form-input" type="number" name="standardDeduction" value={formData.standardDeduction} onChange={handleInputChange} min="0" />
                    </div>
                    <div className="form-row">
                      <label className="form-label">Rebate Amount (₹)</label>
                      <input className="form-input" type="number" name="rebateAmount" value={formData.rebateAmount} onChange={handleInputChange} min="0" />
                    </div>
                    <div className="form-row">
                      <label className="form-label">Rebate Limit (₹)</label>
                      <input className="form-input" type="number" name="rebateLimit" value={formData.rebateLimit} onChange={handleInputChange} min="0" />
                      <small className="form-help">Taxable income must be ≤ this limit to get rebate</small>
                    </div>
                    <div className="form-row">
                      <label className="form-label">Cess Percentage (%)</label>
                      <input className="form-input" type="number" name="cessPercentage" value={formData.cessPercentage} onChange={handleInputChange} min="0" max="100" step="0.01" />
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

export default TaxRegimeManagement;
