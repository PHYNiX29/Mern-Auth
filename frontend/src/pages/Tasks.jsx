import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { taskSchema, parseZodErrors } from '../schemas/index.js';
import RateLimitBanner from '../components/RateLimitBanner.jsx';

// ─────────────────────────────────────────────────────────
// Task Modal (Create / Edit)
// ─────────────────────────────────────────────────────────
const TaskModal = ({ task, onClose, onSave }) => {
  const isEdit = Boolean(task?._id);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = taskSchema.safeParse(form);
    if (!result.success) {
      setErrors(parseZodErrors(result.error));
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      if (isEdit) {
        const res = await api.patch(`/tasks/${task._id}`, result.data);
        onSave(res.data.data, 'edit');
      } else {
        const res = await api.post('/tasks', result.data);
        onSave(res.data.data, 'create');
      }
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✏️ Edit Task' : '➕ New Task'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal" id="modal-close-btn">✕</button>
        </div>

        {apiError && (
          <div className="alert alert-error mb-4">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                type="text"
                name="title"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Task title"
                value={form.title}
                onChange={handleChange}
                autoFocus
              />
              {errors.title && <span className="form-error">⚠ {errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                name="description"
                className={`form-input ${errors.description ? 'error' : ''}`}
                placeholder="Optional description…"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  name="status"
                  className="form-input filter-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  name="priority"
                  className="form-input filter-select"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} id="task-modal-cancel-btn">Cancel</button>
            <button type="submit" className="btn btn-primary" id="task-modal-save-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Tasks Page
// ─────────────────────────────────────────────────────────
const Tasks = () => {
  const { isAdmin, user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);

  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', task?: ... }
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data);
      setFromCache(res.data.fromCache);
    } catch (err) {
      if (err.response?.status === 429) {
        setRateLimit({ retryAfter: err.response.data?.retryAfter || 60 });
      } else {
        setError(err.response?.data?.message || 'Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      if (err.response?.status === 429) {
        setRateLimit({ retryAfter: err.response.data?.retryAfter || 60 });
      } else {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleSave = (savedTask, mode) => {
    if (mode === 'create') {
      setTasks((prev) => [savedTask, ...prev]);
    } else {
      setTasks((prev) => prev.map((t) => (t._id === savedTask._id ? savedTask : t)));
    }
  };

  // Filtered view
  const filtered = tasks.filter((t) => {
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    const matchPriority = filterPriority ? t.priority === filterPriority : true;
    return matchStatus && matchPriority;
  });

  // Stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <>
      {rateLimit && (
        <RateLimitBanner
          retryAfter={rateLimit.retryAfter}
          onDismiss={() => { setRateLimit(null); fetchTasks(); }}
        />
      )}

      {modal && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div className="dashboard-page">
        <div className="container">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                {isAdmin ? '👑 All Tasks' : '📋 My Tasks'}
              </h1>
              <p className="page-subtitle">
                {isAdmin ? 'Admin view – managing all users\' tasks' : 'Your personal task board'}
                {fromCache && (
                  <span className="cache-indicator" style={{ marginLeft: '0.75rem' }}>
                    ⚡ Cached
                  </span>
                )}
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setModal({ mode: 'create' })}
              id="create-task-btn"
            >
              + New Task
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Total', value: stats.total },
              { label: 'To Do', value: stats.todo },
              { label: 'In Progress', value: stats.inProgress },
              { label: 'Done ✓', value: stats.done },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
              </div>
            ))}
          </div>

          {error && <div className="alert alert-error mb-4">{error}</div>}

          {/* Toolbar */}
          <div className="tasks-toolbar">
            <div className="tasks-filters">
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                id="filter-status"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                className="filter-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                id="filter-priority"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={fetchTasks} id="refresh-tasks-btn">
              ↻ Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="loading-screen">
              <div className="spinner spinner-lg" />
              <span>Loading tasks…</span>
            </div>
          ) : (
            <div className="tasks-table-wrapper">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-text">
                    {tasks.length === 0
                      ? "No tasks yet. Create your first task!"
                      : "No tasks match the current filters."}
                  </div>
                </div>
              ) : (
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      {isAdmin && <th>Owner</th>}
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((task) => (
                      <tr key={task._id}>
                        <td>
                          <div className="task-title-cell" title={task.title}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="task-owner" style={{ marginTop: '0.2rem' }}>
                              {task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${task.status}`}>
                            {task.status === 'todo' ? '○ To Do' : task.status === 'in-progress' ? '◑ In Progress' : '● Done'}
                          </span>
                        </td>
                        <td>
                          <span className={`priority-badge ${task.priority}`}>
                            {task.priority}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="task-owner">
                            {task.owner?.name || 'Unknown'}
                          </td>
                        )}
                        <td className="task-owner">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="task-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setModal({ mode: 'edit', task })}
                              id={`edit-task-${task._id}`}
                            >
                              Edit
                            </button>
                            {(isAdmin || task.owner?._id === user?.id || task.owner === user?.id) && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(task._id)}
                                id={`delete-task-${task._id}`}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Tasks;
