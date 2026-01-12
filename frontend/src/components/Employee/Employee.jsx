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
     Status Change
  ---------------------------------- */
  const handleStatusChange = async (employeeId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    if (!window.confirm(`Change status to ${newStatus}?`)) return;

    try {
      await employeeService.updateEmployee(employeeId, { status: newStatus });
      setSuccess(`Employee marked as ${newStatus}`);
      // 👉 AUTO-SWITCH TAB BASED ON NEW STATUS
    setActiveTab(newStatus === "Active" ? "active" : "inactive");
      loadEmployees();
    } catch (err) {
      console.error(err);
      setError("Failed to update status");
    }
  };

  /* ----------------------------------
     Search Filter
  ---------------------------------- */
  const filteredEmployees = tabFilteredEmployees.filter((emp) =>
    [emp.employeeId, emp.name, emp.email,emp.department, emp.designation]
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
          <div className="stat-content">
            <div className="stat-number">{employees.length}</div>
            <div className="stat-label">All Employees</div>
          </div>
        </div>

        <div className="stat-card active-employees">
          <div className="stat-content">
            <div className="stat-number">
              {employees.filter((emp) => emp.status === "Active").length}
            </div>
            <div className="stat-label">Current Employees</div>
          </div>
        </div>

        <div className="stat-card inactive-employees">
          <div className="stat-content">
            <div className="stat-number">
              {employees.filter((emp) => emp.status === "Inactive").length}
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
              {/* <th>Actions</th> */}
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
                <tr key={emp._id || emp.employeeId}>
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
                    {/* <td>
                      <div className="action-buttons">
                        <button
                          className={`action-btn ${
                            emp.status === "Active" ? "deactivate-btn" : "activate-btn"
                          }`}
                          onClick={() => handleStatusChange(emp.employeeId, emp.status)}
                        >
                          {emp.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td> */}

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagement;
