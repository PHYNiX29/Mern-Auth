import Task from '../models/Task.model.js';
import getRedisClient from '../config/redis.js';
import logger from '../config/logger.js';

const CACHE_TTL = 60; // seconds

const cacheKey = (userId) => `tasks:${userId}`;

const invalidateCache = async (userId) => {
  try {
    const redis = getRedisClient();
    await redis.del(cacheKey(userId));
    logger.debug(`Cache invalidated for user ${userId}`);
  } catch (err) {
    logger.warn(`Cache invalidation failed: ${err.message}`);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/tasks  – list tasks (with Redis cache)
// ─────────────────────────────────────────────────────────
export const getTasks = async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    const redis = getRedisClient();
    const key = isAdmin ? 'tasks:admin:all' : cacheKey(userId);

    // Try cache first
    const cached = await redis.get(key).catch(() => null);
    if (cached) {
      logger.debug(`Cache HIT for ${key}`);
      return res.status(200).json({ success: true, fromCache: true, data: JSON.parse(cached) });
    }

    // Admins see all tasks; users see only their own
    const filter = isAdmin ? {} : { owner: userId };
    const tasks = await Task.find(filter)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });

    // Cache result
    await redis.setex(key, CACHE_TTL, JSON.stringify(tasks)).catch(() => {});
    logger.debug(`Cache MISS for ${key}, stored fresh data`);

    return res.status(200).json({ success: true, fromCache: false, data: tasks });
  } catch (err) {
    logger.error(`getTasks error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/tasks/:id
// ─────────────────────────────────────────────────────────
export const getTask = async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const task = await Task.findById(id).populate('owner', 'name email role');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!isAdmin && task.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    logger.error(`getTask error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/tasks
// ─────────────────────────────────────────────────────────
export const createTask = async (req, res) => {
  const { title, description, status, priority } = req.body;

  try {
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      owner: req.user.id,
    });
    await invalidateCache(req.user.id);
    logger.info(`Task created: "${title}" by user ${req.user.id}`);
    return res.status(201).json({ success: true, message: 'Task created', data: task });
  } catch (err) {
    logger.error(`createTask error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/tasks/:id
// ─────────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!isAdmin && task.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const updated = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    await invalidateCache(task.owner.toString());
    logger.info(`Task updated: ${id} by user ${req.user.id}`);
    return res.status(200).json({ success: true, message: 'Task updated', data: updated });
  } catch (err) {
    logger.error(`updateTask error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/tasks/:id
// ─────────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!isAdmin && task.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(id);
    await invalidateCache(task.owner.toString());
    logger.info(`Task deleted: ${id} by user ${req.user.id}`);
    return res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    logger.error(`deleteTask error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};
