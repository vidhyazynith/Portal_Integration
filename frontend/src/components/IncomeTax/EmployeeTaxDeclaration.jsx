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

const SECTION_LABELS = {
  interestPaidOnHousingLoan: 'Interest on Housing Loan (Sec 24b)',
  section123: 'Section 123 — PF / PPF / Insurance',
  section124: 'Section 124 — NPS Contribution',
  section124_1B: 'Section 124(1B) — Additional NPS',
  section126: 'Section 126 — Medical Insurance',
  section129: 'Section 129 — Education Loan Interest',
  section131: 'Section 131 — Affordable Housing',
  section132: 'Section 132 — EV Loan Interest',
  section133: 'Section 133 — Donations to Charity'
};

const TABS = ['SUBMITTED', 'APPROVED', 'REJECTED'];

const EmployeeTaxDeclaration = () => {
  const [allDeclarations, setAllDeclarations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [deductionLimits, setDeductionLimits] = useState([]);
  const [employeeRegimes, setEmployeeRegimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('SUBMITTED');
  const [viewModal, setViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadAllDeclarations();
    loadEmployees();
    loadFinancialYears();
    loadEmployeeRegimes();
    loadDeductionLimits();
  }, []);

  const loadAllDeclarations = async () => {
    setLoading(true);
    try {
      const data = await employeeTaxDeclarationService.getEmployeeTaxDeclarations();
      const list = data?.data || data?.declarations || [];
      setAllDeclarations(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading declarations:', error);
      setAllDeclarations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees');
      const list = response?.data?.employees || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadFinancialYears = async () => {
    try {
      const data = await financialYearService.getFinancialYears();
      const list = data?.data || [];
      setFinancialYears(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading FY:', error);
      setFinancialYears([]);
    }
  };

  const loadDeductionLimits = async () => {
    try {
      const data = await deductionLimitService.getDeductionLimits();
      const list = data?.data || [];
      setDeductionLimits(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading deduction limits:', error);
      setDeductionLimits([]);
    }
  };

  const loadEmployeeRegimes = async () => {
    try {
      const data = await employeeTaxRegimeService.getEmployeeRegimes();
      const list = data?.data || [];
      setEmployeeRegimes(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading employee regimes:', error);
      setEmployeeRegimes([]);
    }
  };

  const filteredData = useMemo(() => {
    return allDeclarations.filter(d => {
      const matchesTab = d?.declarationStatus === activeTab;
      if (!searchTerm) return matchesTab;
      const term = searchTerm.toLowerCase();
      const matchesSearch = getEmployeeName(d?.employeeId).toLowerCase().includes(term) ||
                            getFYName(d?.financialYearId).toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [allDeclarations, activeTab, searchTerm]);

  const tabCounts = useMemo(() => {
    const counts = { SUBMITTED: 0, APPROVED: 0, REJECTED: 0 };
    allDeclarations.forEach(d => {
      if (counts[d?.declarationStatus] !== undefined) {
        counts[d.declarationStatus]++;
      }
    });
    return counts;
  }, [allDeclarations]);

  const getLimitForSection = (sectionKey, fyId) => {
    if (!fyId || !deductionLimits.length) return 0;
    const type = DEDUCTION_TYPE_MAP[sectionKey];
    const limit = deductionLimits.find(l => {
      const limitFyId = l?.financialYearId?._id || l?.financialYearId;
      const matchesType = l?.deductionType === type;
      const matchesFY = String(limitFyId) === String(fyId);
      const matchesRegime = l?.regime === 'OLD' || l?.regime === 'BOTH';
      return matchesType && matchesFY && matchesRegime;
    });
    return limit ? limit.maximumAmount : 0;
  };

  const getEmployeeName = (empId) => {
    if (!empId) return 'Unknown';
    const emp = employees.find(e => e?.employeeId === empId || e?._id === empId);
    return emp ? `${emp.name} (${emp.employeeId})` : String(empId);
  };

  const getFYName = (fyId) => {
    if (!fyId) return 'Unknown';
    const fy = financialYears.find(f => f?._id === (fyId?._id || fyId));
    return fy ? fy.name : 'Unknown';
  };

  const getAgeLabel = (cat) => AGE_CATEGORIES.find(a => a.value === cat)?.label || cat;

  const getAmount = (item, sectionKey) => {
    if (!item?.exemptionDetails) return 0;
    const val = item.exemptionDetails[sectionKey];
    if (typeof val === 'object' && val !== null) return val.amount || 0;
    return val || 0;
  };

  const getSafeId = (item) => item?._id || item?.id || null;

  // ─── Calculation Logic for View Modal ───
  const calculateDeclarationSummary = (item) => {
    if (!item) return null;
    const fyId = item?.financialYearId?._id || item?.financialYearId;

    // Section deductions
    const sectionAmounts = {};
    let totalSectionDeductions = 0;
    Object.keys(SECTION_LABELS).forEach(key => {
      const amt = getAmount(item, key);
      const limit = getLimitForSection(key, fyId);
      const effective = limit > 0 ? Math.min(amt, limit) : amt;
      sectionAmounts[key] = { declared: amt, limit, effective };
      totalSectionDeductions += effective;
    });

    // HRA
    const hraExemption = getAmount(item, 'hraAndOtherExemptions');
    const hraCalc = item?.exemptionDetails?.hraCalculation;
    const hraBreakdown = hraCalc ? {
      basic: parseFloat(hraCalc.basicPayReceivedPA) || 0,
      da: parseFloat(hraCalc.dearnessAllowanceReceivedPA) || 0,
      hraReceived: parseFloat(hraCalc.houseRentAllowanceReceivedPA) || 0,
      rentPaid: parseFloat(hraCalc.totalRentPaid) || 0,
      metro: !!hraCalc.metroCity
    } : null;

    if (hraBreakdown) {
      const salary = hraBreakdown.basic + hraBreakdown.da;
      const a = Math.max(0, hraBreakdown.rentPaid - (salary * 0.10));
      const b = hraBreakdown.basic * (hraBreakdown.metro ? 0.50 : 0.40);
      const c = hraBreakdown.hraReceived;
      hraBreakdown.calculatedExempted = Math.max(0, Math.min(a, b, c));
      hraBreakdown.calculatedTaxable = Math.max(0, hraBreakdown.hraReceived - hraBreakdown.calculatedExempted);
      hraBreakdown.formulaA = Math.round(a);
      hraBreakdown.formulaB = Math.round(b);
      hraBreakdown.formulaC = Math.round(c);
    }

    // Other income
    const otherIncome = parseFloat(item?.deductionTypes?.otherIncome) || 0;
    const rentalIncome = parseFloat(item?.deductionTypes?.rentalIncomeReceived) || 0;
    const interestIncome = parseFloat(item?.deductionTypes?.interestFromSavingsOrFD) || 0;

    const totalDeductions = totalSectionDeductions + hraExemption;
    const netOtherIncome = otherIncome + rentalIncome + interestIncome;

    return {
      sectionAmounts,
      totalSectionDeductions,
      hraExemption,
      hraBreakdown,
      otherIncome,
      rentalIncome,
      interestIncome,
      netOtherIncome,
      totalDeductions
    };
  };

  const handleApprove = async () => {
    const id = getSafeId(viewItem);
    if (!id) {
      alert('Error: Declaration ID is missing.');
      return;
    }
    if (!window.confirm('Are you sure you want to approve this declaration?')) return;

    setLoading(true);
    try {
      await employeeTaxDeclarationService.approveDeclaration(id);
      alert('Declaration approved successfully!');
      setViewModal(false);
      setViewItem(null);
      loadAllDeclarations();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Error approving declaration';
      alert('Approval failed: ' + msg);
      console.error('Approve error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const id = getSafeId(viewItem);
    if (!id) {
      alert('Error: Declaration ID is missing.');
      return;
    }
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    setLoading(true);
    try {
      await employeeTaxDeclarationService.rejectDeclaration(id, rejectionReason.trim());
      alert('Declaration rejected successfully!');
      setViewModal(false);
      setRejectionReason('');
      setViewItem(null);
      loadAllDeclarations();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Error rejecting declaration';
      alert('Rejection failed: ' + msg);
      console.error('Reject error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openView = (item) => {
    if (!item) return;
    const id = getSafeId(item);
    if (!id) {
      console.error('Item has no ID:', item);
      alert('Error: This declaration has no valid ID');
      return;
    }
    setViewItem(item);
    setRejectionReason('');
    setViewModal(true);
  };

  const summary = useMemo(() => calculateDeclarationSummary(viewItem), [viewItem, deductionLimits]);

  const renderDetailRow = (label, value, isCurrency = true, extra = null) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ color: '#64748b', fontSize: '14px' }}>
        {label}
        {extra && <span style={{ color: '#94a3b8', marginLeft: '8px', fontSize: '12px' }}>{extra}</span>}
      </span>
      <span style={{ fontWeight: 600, color: '#1e293b', fontFamily: "'Courier New', monospace", fontSize: '14px' }}>
        {isCurrency ? `₹ ${Number(value || 0).toLocaleString()}` : value}
      </span>
    </div>
  );

  return (
    <div className="income-tax-management">
      <div className="controls-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by employee or FY..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {TABS.map(tab => (
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
              transition: 'all 0.3s',
              boxShadow: activeTab === tab ? '0 4px 12px rgba(102,126,234,0.3)' : 'none'
            }}
          >
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="tax-table-container">
        {loading ? (
          <div className="table-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-row loading-shimmer" style={{ height: '60px' }}></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="no-records" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <h3>No {activeTab.toLowerCase()} declarations found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : `No ${activeTab.toLowerCase()} declarations available`}</p>
          </div>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Financial Year</th>
                <th>Age Category</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((d, idx) => (
                <tr key={getSafeId(d) || idx}>
                  <td><strong>{getEmployeeName(d?.employeeId)}</strong></td>
                  <td>{getFYName(d?.financialYearId)}</td>
                  <td>{getAgeLabel(d?.ageCategory)}</td>
                  <td>{d?.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${
                      d?.declarationStatus === 'APPROVED' ? 'status-active' :
                      d?.declarationStatus === 'REJECTED' ? 'status-inactive' :
                      d?.declarationStatus === 'SUBMITTED' ? 'status-old' : 'status-inactive'
                    }`}>
                      {d?.declarationStatus || 'UNKNOWN'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button
                        className="action-btns primary"
                        onClick={() => openView(d)}
                        title="View All Deductions & Calculation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
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

      {/* View / Calculation / Action Modal */}
      {viewModal && viewItem && summary && (
        <div className="modals-overlay" onClick={() => setViewModal(false)}>
          <div className="modal-content xlarge-modals" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modals-header">
              <h3>Employee Tax Declaration — {getEmployeeName(viewItem?.employeeId)}</h3>
              <button className="close-btn" onClick={() => setViewModal(false)}>×</button>
            </div>
            <div className="modals-body">

              {/* Basic Info */}
              <div className="form-section" style={{ marginBottom: '24px' }}>
                <h4 className="section-title">Basic Information</h4>
                <div className="detail-grid">
                  {renderDetailRow('Employee', getEmployeeName(viewItem?.employeeId), false)}
                  {renderDetailRow('Financial Year', getFYName(viewItem?.financialYearId), false)}
                  {renderDetailRow('Age Category', getAgeLabel(viewItem?.ageCategory), false)}
                  {renderDetailRow('Status', viewItem?.declarationStatus, false)}
                  {renderDetailRow('Submitted At', viewItem?.submittedAt ? new Date(viewItem.submittedAt).toLocaleString() : '-', false)}
                </div>
              </div>

              {/* Other Income */}
              <div className="form-section" style={{ marginBottom: '24px' }}>
                <h4 className="section-title">Other Income & Deductions</h4>
                <div className="detail-grid">
                  {renderDetailRow('Interest from Savings / FD', viewItem?.deductionTypes?.interestFromSavingsOrFD)}
                  {renderDetailRow('Rental Income Received', viewItem?.deductionTypes?.rentalIncomeReceived)}
                  {renderDetailRow('Municipal Tax Paid', viewItem?.deductionTypes?.municipalTaxPaid)}
                  {renderDetailRow('Housing Loan Interest (Let Out)', viewItem?.deductionTypes?.housingLoanInterestLetOut)}
                  {renderDetailRow('Other Income', viewItem?.deductionTypes?.otherIncome)}
                </div>
              </div>

              {/* HRA Calculation */}
              {summary.hraBreakdown && (
                <div className="form-section" style={{ marginBottom: '24px' }}>
                  <h4 className="section-title">HRA Exemption Calculation</h4>
                  <div className="detail-grid">
                    {renderDetailRow('Basic Pay (p.a)', summary.hraBreakdown.basic)}
                    {renderDetailRow('Dearness Allowance (p.a)', summary.hraBreakdown.da)}
                    {renderDetailRow('HRA Received (p.a)', summary.hraBreakdown.hraReceived)}
                    {renderDetailRow('Total Rent Paid', summary.hraBreakdown.rentPaid)}
                    {renderDetailRow('Metro City', summary.hraBreakdown.metro ? 'Yes' : 'No', false)}
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', marginTop: '16px', border: '1px solid #e2e8f0' }}>
                    {renderDetailRow('(A) Rent paid − 10% of salary', summary.hraBreakdown.formulaA)}
                    {renderDetailRow(`(B) ${summary.hraBreakdown.metro ? '50%' : '40%'} of basic pay`, summary.hraBreakdown.formulaB)}
                    {renderDetailRow('(C) HRA from employer', summary.hraBreakdown.formulaC)}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 10px', marginTop: '8px', borderTop: '2px solid #334155' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>HRA Exempted (Least of A,B,C)</span>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: '18px', fontFamily: 'monospace' }}>
                        ₹ {summary.hraBreakdown.calculatedExempted.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px dashed #94a3b8' }}>
                      <span style={{ fontWeight: 600, color: '#475569' }}>HRA Chargeable to Tax</span>
                      <span style={{ fontWeight: 600, color: '#dc2626', fontFamily: 'monospace' }}>
                        ₹ {summary.hraBreakdown.calculatedTaxable.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    {renderDetailRow('HRA & Other Exemptions (Declared)', summary.hraExemption)}
                  </div>
                </div>
              )}

              {/* Section Deductions */}
              <div className="form-section" style={{ marginBottom: '24px' }}>
                <h4 className="section-title">Section Deductions</h4>
                <div className="detail-grid">
                  {Object.keys(SECTION_LABELS).map(key => {
                    const { declared, limit, effective } = summary.sectionAmounts[key];
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>
                          {SECTION_LABELS[key]}
                          {limit > 0 && <span style={{ color: '#94a3b8', marginLeft: '8px', fontSize: '12px' }}>(Limit: ₹{limit.toLocaleString()})</span>}
                        </span>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace', fontSize: '14px' }}>
                          ₹ {declared.toLocaleString()}
                          {effective !== declared && (
                            <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '6px' }}>(Effective: ₹{effective.toLocaleString()})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calculation Summary Card */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                marginBottom: '24px',
                boxShadow: '0 10px 25px rgba(102,126,234,0.25)'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px' }}>
                  Deduction Calculation Summary
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.9 }}>Total Section Deductions</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '15px' }}>₹ {summary.totalSectionDeductions.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.9 }}>HRA Exemption</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '15px' }}>₹ {summary.hraExemption.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.9 }}>Other Income (Net)</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '15px', color: '#fecaca' }}>+ ₹ {summary.netOtherIncome.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.3)', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>Total Deductions</span>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '20px' }}>₹ {summary.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {viewItem?.declarationStatus === 'REJECTED' && viewItem?.rejectionReason && (
                <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '12px', color: '#991b1b', marginBottom: '24px' }}>
                  <strong>Rejection Reason:</strong>
                  <p style={{ margin: '8px 0 0 0' }}>{viewItem.rejectionReason}</p>
                </div>
              )}

              {viewItem?.declarationStatus === 'APPROVED' && viewItem?.reviewedAt && (
                <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '12px', color: '#065f46', marginBottom: '24px' }}>
                  <strong>Approved by Admin</strong>
                  <p style={{ margin: '8px 0 0 0' }}>Reviewed on: {new Date(viewItem.reviewedAt).toLocaleString()}</p>
                </div>
              )}

              {/* Admin Actions */}
              {viewItem?.declarationStatus === 'SUBMITTED' && (
                <div className="form-section" style={{ marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 className="section-title">Admin Action</h4>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Rejection Reason (required if rejecting)</label>
                    <textarea
                      className="form-textarea"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Enter reason if rejecting..."
                      rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div className="form-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="action-btns success"
                      onClick={handleApprove}
                      disabled={loading}
                      style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
                    >
                      {loading ? 'Processing...' : '✅ Approve Declaration'}
                    </button>
                    <button
                      type="button"
                      className="action-btns danger"
                      onClick={handleReject}
                      disabled={loading}
                      style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
                    >
                      {loading ? 'Processing...' : '❌ Reject Declaration'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="action-btns"
                  onClick={() => setViewModal(false)}
                  style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
                >
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

export default EmployeeTaxDeclaration;