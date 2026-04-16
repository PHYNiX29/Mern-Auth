import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" id="navbar-brand">
          ⚡ Primetrade
        </Link>

        <div className="navbar-actions">
          {user ? (
            <>
              <div className="navbar-user">
                <span>{user.name}</span>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </div>
              <Link to="/tasks">
                <button className="btn btn-ghost btn-sm" id="navbar-tasks-btn">Tasks</button>
              </Link>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleLogout}
                id="navbar-logout-btn"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn btn-ghost btn-sm" id="navbar-login-btn">Sign In</button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary btn-sm" id="navbar-register-btn">Get Started</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
