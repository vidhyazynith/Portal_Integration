import React, { useState, useEffect } from 'react';
import { financialYearService } from '../../services/financialYearService';
import './IncomeTax.css';

const FinancialYearManagement = () => {
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financialYearService.getFinancialYears();
      setFinancialYears(data.data || []);
    } catch (error) {
      console.error('Error loading financial years:', error);
      alert('Error loading financial years');
    } finally {
      setLoading(false);
    }
  };

const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target;

  const updatedData = {
    ...formData,
    [name]: type === "checkbox" ? checked : value,
  };

  // Auto generate Financial Year
  if (updatedData.startDate && updatedData.endDate) {
    const startYear = new Date(updatedData.startDate).getFullYear();
    const endYear = new Date(updatedData.endDate).getFullYear();

    updatedData.name = `FY ${startYear}-${endYear}`;
  }

  setFormData(updatedData);
};

  const resetForm = () => {
    setFormData({ name: '', startDate: '', endDate: '', active: true });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await financialYearService.updateFinancialYear(editingItem._id, formData);
        alert('Financial year updated successfully!');
      } else {
        await financialYearService.createFinancialYear(formData);
        alert('Financial year created successfully!');
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving financial year');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      active: item.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this financial year?')) {
      try {
        await financialYearService.deleteFinancialYear(id);
        alert('Financial year deleted successfully!');
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting financial year');
      }
    }
  };

  const filteredData = financialYears.filter(fy => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (fy.name && fy.name.toLowerCase().includes(term));
  });

  return (
    <div className="income-tax-management">
        <div className="controls-btns">
          <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <span>+</span> Add Financial Year
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
            <h3>No financial years found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'No financial years available'}</p>
          </div>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(fy => (
                <tr key={fy._id}>
                  <td><strong>{fy.name}</strong></td>
                  <td>{fy.startDate ? new Date(fy.startDate).toLocaleDateString() : '-'}</td>
                  <td>{fy.endDate ? new Date(fy.endDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btns primary" onClick={() => handleEdit(fy)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="action-btns danger" onClick={() => handleDelete(fy._id)} title="Delete">
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modals-header">
              <h3>{editingItem ? 'Edit Financial Year' : 'Add Financial Year'}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modals-body">
              <form onSubmit={handleSubmit} className="form-sections">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-row">
                      <label className="form-label">Name *</label>
                      <input
                        className="form-input"
                        name="name"
                        value={formData.name}
                        readOnly
                      />
                    </div>

                    <div className="form-row">
                      <label className="form-label">Start Date *</label>
                      <input
                        className="form-input"
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <label className="form-label">End Date *</label>
                      <input
                        className="form-input"
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
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

export default FinancialYearManagement;
