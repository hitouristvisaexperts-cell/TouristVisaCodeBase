require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server: SocketServer } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
const jwt = require('jsonwebtoken');
const socketHelper = require('./utils/socketHelper');

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initInactivityCron } = require('./jobs/inactivityReminder');
const { initDocumentPurgeCron } = require('./jobs/documentPurge');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teamRoutes = require('./routes/team');
const clientRoutes = require('./routes/client');
const faqRoutes = require('./routes/faq');
const paymentRoutes = require('./routes/payment');
const settingsRoutes = require('./routes/settings');
const flightRoutes   = require('./routes/flight');
const stripeRoutes   = require('./routes/stripe');
const articleRoutes  = require('./routes/articles');
const managerRoutes  = require('./routes/manager');
const consentRoutes  = require('./routes/consent');
const leadRoutes     = require('./routes/leads');
const testimonialRoutes = require('./routes/testimonials');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Set secure HTTP headers
app.set('trust proxy', 1);
app.use(helmet());

// CORS — allow portal + marketing site (local dev + production)
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.MARKETING_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://touristvisaexperts.com',
  'https://www.touristvisaexperts.com',
  'https://portal.touristvisaexperts.com',
  'https://calm-narwhal-acf21d.netlify.app',
  'https://effervescent-genie-19e38c.netlify.app',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());

// Body parser with size limit and raw body capture for webhooks (Razorpay / Stripe)
app.use(
  express.json({
    limit: '8mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

// Sanitize MongoDB query injection (e.g. { "$gt": "" })
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Global API rate limiter
app.use('/api/', apiLimiter);

// ─── Document Security ────────────────────────────────────────────────────────
// Direct static access to uploads is disabled for DPDP Act and OWASP compliance.
// All documents must be accessed via authenticated, authorized endpoints.
app.use('/uploads', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Direct file access is disabled. Please access documents through authorized portal endpoints.',
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/flight', flightRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api', leadRoutes); // /api/contact, /api/consultation/*
app.use('/api/testimonials', testimonialRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }

  // Request body errors from express.json / urlencoded (too big, broken JSON)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum 5MB.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid request body.' });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── HTTP + Socket.io ─────────────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

socketHelper.init(io);

// Authenticate socket connections with JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.on('disconnect', () => {});
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
    initInactivityCron();
    initDocumentPurgeCron();
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err?.stack || err);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err?.stack || err);
});

const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    }).catch(() => process.exit(0));
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
