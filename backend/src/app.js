import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/db.js';
import getRedisClient from './config/redis.js';
import logger from './config/logger.js';
import { buildLimiter } from './middleware/rateLimiter.middleware.js';

import authRoutes from './routes/v1/auth.routes.js';
import taskRoutes from './routes/v1/task.routes.js';

const app = express();
const PORT = parseInt(process.env.PORT) || 8000;

// ── Security headers ─────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost',
  'http://frontend',
  'http://frontend:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parser ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logging ─────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ── Health check (no rate limit) ─────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: `backend-${PORT}`,
    timestamp: new Date().toISOString(),
  });
});

// ── Swagger UI ───────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Primetrade API',
      version: '1.0.0',
      description:
        'Scalable REST API with JWT auth, RBAC, Redis caching, and rate limiting.\nBuilt for Primetrade.ai Backend Intern Assignment.',
    },
    servers: [
      { url: `/api`, description: 'Current server' },
      { url: `http://localhost/api`, description: 'Local (via Nginx)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/**/*.js'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ── Bootstrap ────────────────────────────────────────────
const start = async () => {
  // 1. Connect to MongoDB Atlas
  await connectDB();

  // 2. Connect to Redis (get client – it auto-reconnects)
  const redis = getRedisClient();

  // 3. Build rate limiters after Redis is available
  const apiLimiter = buildLimiter({ keyPrefix: 'rl:api', redis });
  const authLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyPrefix: 'rl:auth',
    redis,
  });

  // 4. Mount routes with rate limiters injected
  app.use('/api/', apiLimiter);
  app.use('/api/v1/auth', authLimiter, authRoutes);
  app.use('/api/v1/tasks', taskRoutes);

  // ── 404 handler ──────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
  });

  // ── Global error handler ─────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  // 5. Start listening
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`✅ Backend server running on port ${PORT}`);
    logger.info(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
  });
};

start().catch((err) => {
  logger.error(`❌ Failed to start server: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
