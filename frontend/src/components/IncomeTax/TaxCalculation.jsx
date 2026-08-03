import React, { useState, useEffect } from 'react';
import { taxCalculationService } from '../../services/taxCalculationService';
import { financialYearService } from '../../services/financialYearService';
import api from '../../services/api';
import './IncomeTax.css';

const TaxCalculation = () => {
  const [employees, setEmployees] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedFY, setSelectedFY] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);

  useEffect(() => {
    loadEmployees();
    loadFinancialYears();
  }, []);

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

  const handleEmployeeChange = (empId) => {
    setSelectedEmployee(empId);
    const emp = employees.find(e => e.employeeId === empId);
    setEmployeeDetails(emp || null);
  };

  const handleCalculate = async () => {
    if (!selectedEmployee || !selectedFY) {
      alert('Please select both employee and financial year');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await taxCalculationService.calculateTax(selectedEmployee, selectedFY);
      setResult(data.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error calculating tax');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="income-tax-management">
      <div className="tax-header">
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{employees.length}</div>
            <div className="stat-label">Employees</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{financialYears.length}</div>
            <div className="stat-label">Financial Years</div>
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-container" style={{display: 'flex', gap: '12px', maxWidth: '600px'}}>
          <select className="form-select" value={selectedEmployee} onChange={e => handleEmployeeChange(e.target.value)} style={{flex: 1}}>
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp.employeeId}>{emp.name} ({emp.employeeId})</option>
            ))}
          </select>
          <select className="form-select" value={selectedFY} onChange={e => setSelectedFY(e.target.value)} style={{flex: 1}}>
            <option value="">Select Financial Year</option>
            {financialYears.map(fy => (
              <option key={fy._id} value={fy._id}>{fy.name}</option>
            ))}
          </select>
        </div>
        <div className="controls-buttons">
          <button className="add-btn" onClick={handleCalculate} disabled={loading}>
            {loading ? 'Calculating...' : <><span>⚡</span> Calculate Tax</>}
          </button>
        </div>
      </div>

      {employeeDetails && (
        <div className="tax-table-container" style={{marginBottom: '24px', padding: '20px'}}>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Employee Name:</span>
              <span className="detail-value">{employeeDetails.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Employee ID:</span>
              <span className="detail-value">{employeeDetails.employeeId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Designation:</span>
              <span className="detail-value">{employeeDetails.designation}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Department:</span>
              <span className="detail-value">{employeeDetails.department}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">PAN:</span>
              <span className="detail-value">{employeeDetails.panNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="tax-result-container">
          {/* Income Summary */}
          <div className="tax-result-card">
            <h4>Income Summary</h4>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Annual Income (Gross)</span>
                <span className="result-value">{formatCurrency(result.annualIncome)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Other Income</span>
                <span className="result-value">{formatCurrency(result.otherIncome)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">House Property Income</span>
                <span className="result-value">{formatCurrency(result.housePropertyIncome)}</span>
              </div>
              <div className="result-item highlight">
                <span className="result-label">Gross Total Income</span>
                <span className="result-value">{formatCurrency(result.grossTotalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="tax-result-card">
            <h4>Deductions & Exemptions</h4>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Standard Deduction</span>
                <span className="result-value">- {formatCurrency(result.standardDeduction)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Total Deductions</span>
                <span className="result-value">- {formatCurrency(result.totalDeductions)}</span>
              </div>
              <div className="result-item total">
                <span className="result-label">Taxable Income</span>
                <span className="result-value">{formatCurrency(result.taxableIncome)}</span>
              </div>
            </div>
          </div>

          {/* Tax Computation */}
          <div className="tax-result-card">
            <h4>Tax Computation</h4>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Tax Before Cess</span>
                <span className="result-value">{formatCurrency(result.taxBeforeCess)}</span>
              </div>
              {result.rebateApplied > 0 && (
                <div className="result-item">
                  <span className="result-label">Rebate Applied</span>
                  <span className="result-value" style={{color: '#059669'}}>- {formatCurrency(result.rebateApplied)}</span>
                </div>
              )}
              <div className="result-item">
                <span className="result-label">Health & Education Cess</span>
                <span className="result-value">+ {formatCurrency(result.cess)}</span>
              </div>
              <div className="result-item final">
                <span className="result-label">Annual Tax Liability</span>
                <span className="result-value">{formatCurrency(result.annualTax)}</span>
              </div>
            </div>
          </div>

          {/* TDS */}
          <div className="tax-result-card" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
            <h4 style={{color: 'white', borderBottom: '2px solid rgba(255,255,255,0.3)'}}>Monthly TDS</h4>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0'}}>
              <span style={{fontSize: '18px', fontWeight: 700}}>Monthly TDS to be Deducted</span>
              <span style={{fontSize: '28px', fontWeight: 800, color: '#ffd93d', fontFamily: "'Courier New', monospace"}}>
                {formatCurrency(result.monthlyTDS)}
              </span>
            </div>
            <div style={{fontSize: '13px', opacity: 0.9, marginTop: '8px'}}>
              Regime: <strong>{result.regime}</strong> | Taxable Income: {formatCurrency(result.taxableIncome)}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="tax-table-container" style={{padding: '60px 20px', textAlign: 'center'}}>
          <div style={{color: '#6b7280'}}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{marginBottom: '16px'}}>
              <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <h3 style={{marginBottom: '8px', color: '#374151'}}>Calculate Income Tax</h3>
            <p>Select an employee and financial year, then click Calculate Tax to view the breakdown.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculation;