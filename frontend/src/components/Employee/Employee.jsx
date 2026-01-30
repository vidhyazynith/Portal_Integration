import React, { useEffect, useState } from "react";
import { employeeService } from "../../services/employee";
import "./Employee.css";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedEmployee, setSelectedEmployee] = useState(null); // NEW: For storing clicked employee
  const [showModal, setShowModal] = useState(false); // NEW: For modal visibility

  /* ----------------------------------
     Load Employees
  ---------------------------------- */
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const tabFilteredEmployees = employees.filter(emp =>
    activeTab === "active"
      ? emp.status === "Active"
      : emp.status === "Inactive"
  );

  /* ----------------------------------
     NEW: Handle Employee Click
  ---------------------------------- */
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  /* ----------------------------------
     NEW: Close Modal
  ---------------------------------- */
  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  /* ----------------------------------
     Status Change
  ---------------------------------- */
  const handleStatusChange = async (employeeId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    if (!window.confirm(`Change status to ${newStatus}?`)) return;

    try {
      await employeeService.updateEmployee(employeeId, { status: newStatus });
      setSuccess(`Employee marked as ${newStatus}`);
      setActiveTab(newStatus === "Active" ? "active" : "inactive");
      loadEmployees();
      // If modal is open for this employee, update it
      if (selectedEmployee && selectedEmployee.employeeId === employeeId) {
        setSelectedEmployee(prev => ({
          ...prev,
          status: newStatus
        }));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update status");
    }
  };

  /* ----------------------------------
     Search Filter
  ---------------------------------- */
  const filteredEmployees = tabFilteredEmployees.filter((emp) =>
    [emp.employeeId, emp.name, emp.email, emp.department, emp.designation]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="employee-management">
      {/* Alerts */}
      {success && (
        <div className="alert success-alert">
          <span>{success}</span>
          <button className="close-alert" onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="alert error-alert">
          <span>{error}</span>
          <button className="close-alert" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
<div className="stats-cards-container">
      <div className="stat-card total-employees">
        <div className="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">{employees.length}</div>
          <div className="stat-label">All Employees</div>
        </div>
      </div>

      <div className="stat-card active-employees">
        <div className="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">
            {employees.filter(emp => emp.status === 'Active').length}
          </div>
          <div className="stat-label">Current Employees</div>
        </div>
      </div>

      <div className="stat-card inactive-employees">
        <div className="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">
            {employees.filter(emp => emp.status === 'Inactive').length}
          </div>
          <div className="stat-label">Inactive Employees</div>
        </div>
      </div>
    </div>
    
      <div className="search-box">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by ID, name, department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active Employees
        </button>
        <button
          className={`tab-button ${activeTab === "inactive" ? "active" : ""}`}
          onClick={() => setActiveTab("inactive")}
        >
          Inactive Employees
        </button>
      </div>

      {/* Table */}
      <div className="employees-table-container">
        <table className="employees-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Joining Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  Loading...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No employees found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr 
                  key={emp._id || emp.employeeId}
                  onClick={() => handleEmployeeClick(emp)} // NEW: Click handler
                  className="employee-row-clickable" // NEW: For styling
                >
                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email || "-"}</td>
                  <td>{emp.department || "-"}</td>
                  <td>{emp.designation || "-"}</td>
                  <td>
                    {emp.joiningDate
                      ? new Date(emp.joiningDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        emp.status === "Active"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* NEW: Employee Details Modal */}
{showModal && selectedEmployee && (
  <div className="employee-modal-overlay" onClick={closeModal}>
    <div className="employee-modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="employee-modal-header">
        <h2>Employee Details</h2>
        <button className="employee-modal-close" onClick={closeModal}>
          ×
        </button>
      </div>
      
      <div className="employee-modal-body">
        <div className="employee-details-grid">
          <div className="employee-detail-row">
            <span className="employee-detail-label">Employee ID:</span>
            <span className="employee-detail-value">{selectedEmployee.employeeId}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Name:</span>
            <span className="employee-detail-value">{selectedEmployee.name}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Email:</span>
            <span className="employee-detail-value">{selectedEmployee.email || "-"}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Department:</span>
            <span className="employee-detail-value">{selectedEmployee.department || "-"}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Designation:</span>
            <span className="employee-detail-value">{selectedEmployee.designation || "-"}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Joining Date:</span>
            <span className="employee-detail-value">
              {selectedEmployee.joiningDate
                ? new Date(selectedEmployee.joiningDate).toLocaleDateString()
                : "-"}
            </span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Phone:</span>
            <span className="employee-detail-value">{selectedEmployee.phone || "-"}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">PAN Number:</span>
            <span className="employee-detail-value">{selectedEmployee.panNumber || "-"}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Aadhar Number:</span>
            <span className="employee-detail-value">{selectedEmployee.aadharNumber || "-"}</span>
          </div>
          <div className="employee-detail-row">
            <span className="employee-detail-label">Status:</span>
            <span className={`employee-detail-value employee-status-badge ${
              selectedEmployee.status === "Active" 
                ? "employee-status-active" 
                : "employee-status-inactive"
            }`}>
              {selectedEmployee.status}
            </span>
          </div>
        </div>
        
        <div className="employee-modal-actions">
          <button className="employee-btn-close-modal" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default EmployeeManagement;