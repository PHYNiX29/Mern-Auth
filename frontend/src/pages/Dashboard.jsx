import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="page-subtitle">
              Manage your tasks and monitor activity from your dashboard
            </p>
          </div>
          <Link to="/tasks">
            <button className="btn btn-primary" id="dashboard-go-tasks-btn">
              → Go to Tasks
            </button>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 className="modal-title" style={{ marginBottom: '1.5rem' }}>Your Profile</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="form-label">Name</div>
              <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{user?.name}</div>
            </div>
            <div>
              <div className="form-label">Email</div>
              <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{user?.email}</div>
            </div>
            <div>
              <div className="form-label">Role</div>
              <div style={{ marginTop: '0.4rem' }}>
                <span className={`role-badge ${user?.role}`}>{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            {
              icon: '🔒',
              title: 'JWT Authentication',
              desc: 'Secure token-based authentication with 7-day expiry and bcrypt hashing.',
            },
            {
              icon: '⚡',
              title: 'Redis Caching',
              desc: 'Task lists are cached in Redis for 60 seconds to reduce DB load.',
            },
            {
              icon: '🔄',
              title: 'Load Balanced',
              desc: '5 backend instances running on ports 8000–8004 via Nginx round-robin.',
            },
            {
              icon: '🛡️',
              title: 'Rate Limiting',
              desc: '100 req/min shared across all instances via Redis. Auth limited to 20/15min.',
            },
            {
              icon: '✅',
              title: 'Zod Validation',
              desc: 'All inputs validated on both frontend and backend using Zod schemas.',
            },
            {
              icon: '👑',
              title: isAdmin ? 'Admin Mode' : 'User Mode',
              desc: isAdmin
                ? 'You can view and manage ALL users\' tasks.'
                : 'You can create and manage your own tasks.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="stat-card" style={{ flexDirection: 'row', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{title}</div>
                <div className="text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scalability Note */}
        <div className="glass-card" style={{ marginTop: '2rem', borderColor: 'rgba(99,102,241,0.3)' }}>
          <h3 style={{ marginBottom: '1rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            📈 Scalability Architecture Note
          </h3>
          <div className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
            <p>
              This application is designed for horizontal scalability. The backend runs as
              <strong style={{ color: 'var(--color-text)' }}> 5 independent Node.js instances</strong>{' '}
              (ports 8000–8004), all load-balanced by <strong style={{ color: 'var(--color-text)' }}>Nginx</strong> using
              round-robin. Rate limiting state and task cache are stored in a shared{' '}
              <strong style={{ color: 'var(--color-text)' }}>Redis</strong> instance so all backend nodes remain consistent.
            </p>
            <br />
            <p>
              To scale further: add more backend instances to the Nginx upstream block,
              upgrade to Redis Cluster, or migrate to a microservices architecture
              with separate auth, task, and notification services (see PHYNiX project).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
