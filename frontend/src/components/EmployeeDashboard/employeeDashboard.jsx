import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeDashService } from '../../services/employeeDash';
import './employeeDashboard.css';
import { Navigate } from 'react-router-dom';
 
const EmployeeDashboard = () => {
  const { user , logout } = useAuth();
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [currentSalary, setCurrentSalary] = useState(null);
  const [salaryStats, setSalaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('salary');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
 
  useEffect(() => {
    if (user) {
      loadEmployeeData();
    }
  }, [user]);
 
 
 
  const handleLogout = () => {
    logout();
    Navigate('/admin/login');
  };
 
  const loadEmployeeData = async () => {
    try {
      setLoading(true);
     
      // Load all employee data in parallel
      const [
        profileResponse,
        payslipsResponse,
        salaryHistoryResponse,
        currentSalaryResponse,
        salaryStatsResponse
      ] = await Promise.all([
        employeeDashService.getEmployeeProfile(),
        employeeDashService.getEmployeePayslips(),
        employeeDashService.getSalaryHistory(),
        employeeDashService.getCurrentSalary(),
        employeeDashService.getSalaryStats()
      ]);
 
      setEmployeeDetails(profileResponse.employee);
      setPayslips(payslipsResponse.payslips || []);
      setSalaryHistory(salaryHistoryResponse.salaries || []);
      setCurrentSalary(currentSalaryResponse.currentSalary);
      setSalaryStats(salaryStatsResponse.stats);
 
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleDownloadPayslip = async (payslipId) => {
    try {
      // This would need to be implemented in your employeeDashService
      const blob = await employeeDashService.downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading payslip');
    }
  };
 
 
  const handleViewPayslip = async (payslipId) => {
    try {
      const response = await employeeDashService.getPayslipDetails(payslipId);
      setSelectedPayslip(response.payslip);
      setShowPayslipModal(true);
    } catch (error) {
      alert('Error loading payslip details');
    }
  };
 
 
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
 
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
 
  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || monthNumber;
  };
 
  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="employee-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {employeeDetails?.name || 'Employee'}! 👋</h1>
          <p>Here's your professional dashboard and salary information</p>
        </div>
        <div className="employee-badge">
          <div className="badge-avatar">
            {employeeDetails?.name?.charAt(0) || 'E'}
          </div>
          <div className="badge-info">
            <span className="employee-id">{employeeDetails?.employeeId}</span>
            <span className="employee-role">{employeeDetails?.designation}</span>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
 
      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'salary' ? 'active' : ''}`}
          onClick={() => setActiveTab('salary')}
        >
          💵 Salary History
        </button>
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
      </div>
 
      {/* Content Area */}
      <div className="dashboard-content">
 
        {activeTab === 'salary' && (
          <div className="salary-tab">
            <div className="content-section">
              <div className="section-header">
                <h3>Salary History</h3>
                <span className="payslip-count">{payslips.length} records</span>
              </div>

            {/* Salary History Table */}
            <div className="salary-table-container">
              <table className="salary-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Pay Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((payslip) => (
                    <tr key={payslip._id}>
                      <td>
                        <strong>{payslip.month} {payslip.year}</strong>
                      </td>
                      <td>
                        <span className={`status-badge status-${'paid'}`}>
                          {'Paid'}
                        </span>
                      </td>
                      <td>
                        {payslip.payDate ? formatDate(payslip.payDate) : 
                        payslip.createdAt ? formatDate(payslip.createdAt) : 'Pending'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btns primary"
                            onClick={() => handleViewPayslip(payslip._id)}
                            title="View Details"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                          <button
                            className="action-btns success"
                            onClick={() => handleDownloadPayslip(payslip._id)}
                            title="Download Payslip"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-table">
                        <div className="empty-state">
                          <div className="empty-icon">💵</div>
                          <h4>No Payslip History</h4>
                          <p>Your payslips will be available here once processed by the HR department.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}
 
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <div className="content-section">
              <h3>Professional Details</h3>
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {employeeDetails?.name?.charAt(0) || 'E'}
                  </div>
                  <div className="profile-info">
                    <h2>{employeeDetails?.name || 'N/A'}</h2>
                    <p>{employeeDetails?.designation || 'N/A'} • {employeeDetails?.department || 'N/A'}</p>
                  </div>
                </div>
 
                <div className="profile-details-grid">
                  <div className="detail-group">
                    <label>Employee ID</label>
                    <span>{employeeDetails?.employeeId || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Email Address</label>
                    <span>{employeeDetails?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Phone Number</label>
                    <span>{employeeDetails?.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Date of Joining</label>
                    <span>
                      {employeeDetails?.joiningDate ?
                        formatDate(employeeDetails.joiningDate) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-group">
                    <label>Department</label>
                    <span>{employeeDetails?.department || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Designation</label>
                    <span>{employeeDetails?.designation || 'N/A'}</span>
                  </div>
                  {/* Address Section */}
                  <div className="detail-group full-width">
                    <label>Address</label>
                    <div className="address-details structured">
                      {employeeDetails?.address?.addressLine1 && (
                        <div className="address-line">
                          <span className="address-value">{employeeDetails.address.addressLine1 ? `${employeeDetails.address.addressLine1},` :''}</span>
                        </div>
                      )}
                      {employeeDetails?.address?.addressLine2 && (
                        <div className="address-line">
                          <span className="address-value">{employeeDetails.address.addressLine2? `${employeeDetails.address.addressLine2},` :''}</span>
                        </div>
                      )}
                      {(employeeDetails?.address?.city || employeeDetails?.address?.state || employeeDetails?.address?.pinCode) && (
                        <div className="address-line">
                          <span className="address-value">
                            {employeeDetails?.address?.city ? `${employeeDetails.address.city} ` : ''}
                            {employeeDetails?.address?.pinCode ? ` - ${employeeDetails.address.pinCode},` : ''}
                            {employeeDetails?.address?.state ? `${employeeDetails?.address?.state}.` : ''}
                          </span>
                        </div>
                      )}
                      {!employeeDetails?.address?.addressLine1 && !employeeDetails?.address?.addressLine2 && 
                      !employeeDetails?.address?.city && !employeeDetails?.address?.state && !employeeDetails?.address?.pinCode && (
                        <span>N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="detail-group">
                    <label>Member Since</label>
                    <span>
                      {employeeDetails?.createdAt ?
                        formatDate(employeeDetails.createdAt) : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
 
export default EmployeeDashboard;