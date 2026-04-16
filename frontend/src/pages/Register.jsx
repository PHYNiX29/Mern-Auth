import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { registerSchema, parseZodErrors } from '../schemas/index.js';
import RateLimitBanner from '../components/RateLimitBanner.jsx';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      setErrors(parseZodErrors(result.error));
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await register(result.data.name, result.data.email, result.data.password, result.data.role);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 429) {
        setRateLimit({ retryAfter: data?.retryAfter || 60 });
      } else if (status === 422 && data?.errors) {
        const fieldErrors = {};
        for (const e of data.errors) fieldErrors[e.field] = e.message;
        setErrors(fieldErrors);
      } else {
        setApiError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {rateLimit && (
        <RateLimitBanner
          retryAfter={rateLimit.retryAfter}
          onDismiss={() => setRateLimit(null)}
        />
      )}

      <div className="auth-page">
        <div className="auth-card glass-card">
          <div className="auth-header">
            <div className="auth-logo">⚡</div>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join Primetrade and start managing tasks</p>
          </div>

          {apiError && (
            <div className="alert alert-error mb-4" role="alert">
              <span>⚠️</span> {apiError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <span className="form-error">⚠ {errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min 8 chars, upper + lower + number"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <span className="form-error">⚠ {errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Account Type</label>
              <select
                id="reg-role"
                name="role"
                className="form-input filter-select"
                value={form.role}
                onChange={handleChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              id="register-submit-btn"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
