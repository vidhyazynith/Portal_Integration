import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await authService.forgotPassword(email.trim());
      setSuccessMessage(
        response.message || 'Password reset link sent! Please check your email inbox.'
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to send reset link. Please verify your email and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left-panel">
        <div className="brand-content"></div>
      </div>

      <div className="login-right-panel">
        <div className="login-card forgot-card">
          {/* Lock Icon */}
          <div className="user-icon forgot-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-16 h-16"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <h2 className="login-title">ZYNITH-IT SOLUTIONS</h2>
          <h1 className="company-name">RESET YOUR PASSWORD</h1>
          <div className="enhanced-divider"></div>

          {successMessage ? (
            <div className="forgot-success-container">
              <div className="success-icon-badge">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  style={{ width: '28px', height: '28px', color: '#16a34a' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h3 className="success-title">Check Your Email</h3>
              <p className="success-desc">
                We sent a password reset link to <strong>{email}</strong>.
              </p>
              <p className="success-subtext">
                Please check your inbox (and spam folder) and click the link to reset your password. The link will expire in 1 hour.
              </p>
              <div className="forgot-action-group">
                <Link to="/login" className="signin-btn back-login-btn">
                  Back to Sign In
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage('');
                    setEmail('');
                  }}
                  className="resend-btn"
                >
                  Send another link
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="forgot-instruction">
                Enter your registered email address below, and we will send you a secure link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                {error && (
                  <div className="enhanced-error-message">
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                    placeholder="Enter your registered email"
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? (
                    <span>
                      Sending Link<span className="enhanced-loading-dots"></span>
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="back-to-login-wrapper">
                  <Link to="/login" className="back-to-login-link">
                    ← Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

