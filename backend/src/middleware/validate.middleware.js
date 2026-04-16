import { ZodError } from 'zod';
import logger from '../config/logger.js';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (sanitized) data.
 * On failure, returns 422 with structured errors.
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      logger.warn('Validation failed', { path: req.path, errors });
      return res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        errors,
      });
    }
    next(err);
  }
};

export default validate;
