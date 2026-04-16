import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import logger from '../config/logger.js';

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn(`Registration failed – email already in use: ${email}`);
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // ── Manually bcrypt hash before saving ──────────────────
    // (Do NOT rely on a pre-save hook — we hash right here in the controller)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,   // stored as a plain string in MongoDB
      role: role || 'user',
    });

    const token = signToken(user);

    logger.info(`New user registered: ${email} (${user.role})`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error(`Register error: ${err.message}`, { stack: err.stack });
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn(`Login failed – user not found: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare plaintext password against the bcrypt hash string
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed – wrong password for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);

    logger.info(`User logged in: ${email} (${user.role})`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`, { stack: err.stack });
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/auth/me  (protected)
// ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    logger.debug(`/me accessed by user ${req.user.id}`);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    logger.error(`GetMe error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
