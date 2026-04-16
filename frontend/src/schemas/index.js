import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name too long'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and a number'
    ),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const taskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title too long'),
  description: z.string().max(2000, 'Too long').optional().default(''),
  status: z.enum(['todo', 'in-progress', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

export const parseZodErrors = (err) => {
  const fieldErrors = {};
  if (err?.errors) {
    for (const e of err.errors) {
      const key = e.path[0] || '_root';
      if (!fieldErrors[key]) fieldErrors[key] = e.message;
    }
  }
  return fieldErrors;
};
