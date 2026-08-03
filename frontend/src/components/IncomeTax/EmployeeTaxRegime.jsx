import React, { useState, useEffect } from 'react';
import { employeeTaxRegimeService } from '../../services/employeeTaxRegimeService';
import { financialYearService } from '../../services/financialYearService';
import api from '../../services/api';
import './IncomeTax.css';

const EmployeeTaxRegime = () => {
  const [regimes, setRegimes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    financialYearId: '',
    regime: 'NEW'
  });

  useEffect(() => {
    loadData();
    loadEmployees();
    loadFinancialYears();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await employeeTaxRegimeService.getEmployeeRegimes();
      setRegimes(data.data || []);
    } catch (error) {
      console.error('Error loading employee regimes:', error);
      alert('Error loading employee regimes');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      financialYearId: financialYears[0]?._id || '',
      regime: 'NEW'
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await employeeTaxRegimeService.updateEmployeeRegime(editingItem._id, formData);
        alert('Employee regime updated successfully!');
      } else {
        await employeeTaxRegimeService.assignEmployeeRegime(formData);
        alert('Employee regime assigned successfully!');
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving employee regime');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId,
      financialYearId: item.financialYearId?._id || item.financialYearId,
      regime: item.regime
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee regime?')) {
      try {
        await employeeTaxRegimeService.deleteEmployeeRegime(id);
        alert('Employee regime deleted successfully!');
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting employee regime');
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

  const filteredData = regimes.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return getEmployeeName(r.employeeId).toLowerCase().includes(term) || getFYName(r.financialYearId).toLowerCase().includes(term);
  });

  return (
    <div className="income-tax-management">
      <div className="tax-header">
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{regimes.length}</div>
            <div className="stat-label">Total Assignments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{regimes.filter(r => r.regime === 'OLD').length}</div>
            <div className="stat-label">Old Regime</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{regimes.filter(r => r.regime === 'NEW').length}</div>
            <div className="stat-label">New Regime</div>
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-container">
          <input type="text" placeholder="Search by employee or FY..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="controls-btns">
          <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
            <span>+</span> Assign Regime
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
            <h3>No employee regimes found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'No employee regimes assigned yet'}</p>
          </div>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Financial Year</th>
                <th>Regime</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(r => (
                <tr key={r._id}>
                  <td><strong>{getEmployeeName(r.employeeId)}</strong></td>
                  <td>{getFYName(r.financialYearId)}</td>
                  <td>
                    <span className={`status-badge status-${r.regime.toLowerCase()}`}>{r.regime}</span>
                  </td>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modals-header">
              <h3>{editingItem ? 'Edit Employee Regime' : 'Assign Tax Regime'}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modals-body">
              <form onSubmit={handleSubmit} className="form-sections">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Employee *</label>
                      <select className="form-select" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required>
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp.employeeId}>{emp.name} ({emp.employeeId})</option>
                        ))}
                      </select>
                    </div>
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
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="action-btns" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="action-btns primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingItem ? 'Update' : 'Assign')}
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

export default EmployeeTaxRegime;