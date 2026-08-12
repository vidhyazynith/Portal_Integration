import React, { useState, useEffect } from 'react';
import { taxSlabService } from '../../services/taxSlabService';
import { taxRegimeService } from '../../services/taxRegimeService';
import { financialYearService } from '../../services/financialYearService';
import './IncomeTax.css';

const TaxSlabManagement = () => {
  const [slabs, setSlabs] = useState([]);
  const [regimes, setRegimes] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRegime, setSelectedRegime] = useState('Old');
  const [formData, setFormData] = useState({
    taxRegimeId: '',
    fromAmount: 0,
    toAmount: '',
    percentage: 0,
    active: true
  });

  useEffect(() => {
    loadData();
    loadRegimes();
    loadFinancialYears();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await taxSlabService.getTaxSlabs();
      setSlabs(data.data || []);
    } catch (error) {
      console.error('Error loading tax slabs:', error);
      alert('Error loading tax slabs');
    } finally {
      setLoading(false);
    }
  };

  const loadRegimes = async () => {
    try {
      const data = await taxRegimeService.getTaxRegimes();
      setRegimes(data.data || []);
    } catch (error) {
      console.error('Error loading regimes:', error);
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
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value)
    }));
  };

  const resetForm = () => {
    setFormData({
      taxRegimeId: '',
      fromAmount: 0,
      toAmount: '',
      percentage: 0,
      order: 1,
      active: true
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...formData,
      toAmount: formData.toAmount === '' ? null : parseFloat(formData.toAmount)
    };
    try {
      if (editingItem) {
        await taxSlabService.updateTaxSlab(editingItem._id, payload);
        alert('Tax slab updated successfully!');
      } else {
        await taxSlabService.createTaxSlab(payload);
        alert('Tax slab created successfully!');
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving tax slab');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      taxRegimeId: item.taxRegimeId?._id || item.taxRegimeId,
      fromAmount: item.fromAmount,
      toAmount: item.toAmount || '',
      percentage: item.percentage,
      order: item.order,
      active: item.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax slab?')) {
      try {
        await taxSlabService.deleteTaxSlab(id);
        alert('Tax slab deleted successfully!');
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting tax slab');
      }
    }
  };

  const getRegimeLabel = (regimeId) => {
    const reg = regimes.find(r => r._id === (regimeId?._id || regimeId));
    if (!reg) return 'Unknown';
    const fy = financialYears.find(f => f._id === (reg.financialYearId?._id || reg.financialYearId));
    return `${reg.regime} - ${fy ? fy.name : 'Unknown FY'}`;
  };

const filteredData = slabs.filter(s => {
  const regime = regimes.find(
    r => r._id === (s.taxRegimeId?._id || s.taxRegimeId)
  );

  const matchesSearch = !searchTerm
    ? true
    : getRegimeLabel(s.taxRegimeId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

  const matchesRegime = regime?.regime?.toLowerCase().includes(selectedRegime.toLowerCase());
  return matchesSearch && matchesRegime;
});

  return (
    <div className="income-tax-management">
        <div className="controls-btns">
          <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <span>+</span> Add Tax Slab
          </button>
        </div>

      <div className="regime-tabs">
          <button
            className={selectedRegime === "Old" ? "tab active" : "tab"}
            onClick={() => setSelectedRegime("Old")}
          >
            Old Regime
          </button>

          <button
            className={selectedRegime === "New" ? "tab active" : "tab"}
            onClick={() => setSelectedRegime("New")}
          >
            New Regime
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
            <h3>No tax slabs found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'No tax slabs available'}</p>
          </div>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>Regime</th>
                <th>From Amount (₹)</th>
                <th>To Amount (₹)</th>
                <th>Tax Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(s => (
                <tr key={s._id}>
                  <td>{getRegimeLabel(s.taxRegimeId)}</td>
                  {/* <td>{s.order}</td> */}
                  <td>₹{s.fromAmount?.toLocaleString()}</td>
                  <td>{s.toAmount ? `₹${s.toAmount.toLocaleString()}` : 'Above'}</td>
                  <td><strong>{s.percentage}%</strong></td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btns primary" onClick={() => handleEdit(s)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="action-btns danger" onClick={() => handleDelete(s._id)} title="Delete">
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
              <h3>{editingItem ? 'Edit Tax Slab' : 'Add Tax Slab'}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modals-body">
              <form onSubmit={handleSubmit} className="form-sections">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-row">
                      <label className="form-label">Tax Regime *</label>
                      <select className="form-select" name="taxRegimeId" value={formData.taxRegimeId} onChange={handleInputChange} required>
                        <option value="">Select Regime</option>
                        {regimes.map(r => (
                          <option key={r._id} value={r._id}>
                            {r.regime} - {financialYears.find(f => f._id === (r.financialYearId?._id || r.financialYearId))?.name || 'Unknown'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label className="form-label">From Amount (₹) *</label>
                      <input className="form-input" type="number" name="fromAmount" value={formData.fromAmount} onChange={handleInputChange} min="0" required />
                    </div>
                    <div className="form-row">
                      <label className="form-label">To Amount (₹)</label>
                      <input className="form-input" type="number" name="toAmount" value={formData.toAmount} onChange={handleInputChange} min="0" />
                      <small className="form-help">Leave empty for "Above" (no upper limit)</small>
                    </div>
                    <div className="form-row">
                      <label className="form-label">Percentage (%) *</label>
                      <input className="form-input" type="number" name="percentage" value={formData.percentage} onChange={handleInputChange} min="0" max="100" step="0.01" required />
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

export default TaxSlabManagement;
