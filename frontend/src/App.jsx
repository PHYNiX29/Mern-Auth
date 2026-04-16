import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tasks from './pages/Tasks.jsx';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Public route – redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <div className="page-wrapper">
    <Navbar />
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={<PublicRoute><Login /></PublicRoute>}
      />
      <Route
        path="/register"
        element={<PublicRoute><Register /></PublicRoute>}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/tasks"
        element={<ProtectedRoute><Tasks /></ProtectedRoute>}
      />
      <Route
        path="*"
        element={
          <div className="auth-page" style={{ flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ fontSize: '4rem' }}>🔭</div>
            <h1>404 – Page Not Found</h1>
            <p className="text-muted">The page you're looking for doesn't exist.</p>
            <a href="/dashboard"><button className="btn btn-primary">Go Home</button></a>
          </div>
        }
      />
    </Routes>
  </div>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
