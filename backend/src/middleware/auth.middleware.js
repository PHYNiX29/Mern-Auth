import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

/**
 * Verifies JWT from Authorization header.
 * Sets req.user = { id, role } on success.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    logger.debug(`Authenticated user ${decoded.id} (${decoded.role})`);
    next();
  } catch (err) {
    logger.warn(`JWT verification failed: ${err.message}`);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Role guard factory. Usage: authorize('admin') or authorize('user', 'admin')
 */
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Forbidden: user ${req.user.id} (${req.user.role}) tried to access ${req.path}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
