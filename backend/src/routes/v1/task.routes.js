import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../../controllers/task.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createTaskSchema, updateTaskSchema } from '../../schemas/task.schema.js';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/v1/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks (own tasks; admin gets all)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of tasks }
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in-progress, done] }
 *               priority: { type: string, enum: [low, medium, high] }
 *     responses:
 *       201: { description: Task created }
 */
router.route('/')
  .get(getTasks)
  .post(validate(createTaskSchema), createTask);

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a specific task by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task data }
 *       404: { description: Task not found }
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task updated }
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (admin can delete any, user deletes own)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task deleted }
 */
router.route('/:id')
  .get(getTask)
  .patch(validate(updateTaskSchema), updateTask)
  .delete(deleteTask);

// Admin-only: view all users' tasks explicitly
router.get('/admin/all', authorize('admin'), getTasks);

export default router;
