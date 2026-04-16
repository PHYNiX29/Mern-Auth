import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { loginSchema, parseZodErrors } from '../schemas/index.js';
import RateLimitBanner from '../components/RateLimitBanner.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(null); // { retryAfter }

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side Zod validation
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      setErrors(parseZodErrors(result.error));
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await login(result.data.email, result.data.password);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 429) {
        setRateLimit({ retryAfter: data?.retryAfter || 60 });
      } else {
        setApiError(data?.message || 'Login failed. Please try again.');
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
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your Primetrade account</p>
          </div>

          {apiError && (
            <div className="alert alert-error mb-4" role="alert">
              <span>⚠️</span> {apiError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
              {errors.email && <span className="form-error">⚠ {errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              {errors.password && <span className="form-error">⚠ {errors.password}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              id="login-submit-btn"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one →</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
