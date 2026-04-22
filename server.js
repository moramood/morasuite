/**
 * MoraSuite — Express Server Entry Point
 * Production-ready with helmet, CORS, morgan, cookie-parser, and global error handling.
 */
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const logger = require('./config/logger');
const { initDatabase } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const clienteRoutes = require('./routes/clientes');
const ventaRoutes = require('./routes/ventas');
const dashboardRoutes = require('./routes/dashboard');
const usuarioRoutes = require('./routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / same-origin

    if (!allowedOrigins) return callback(null, true); // sin restricción (dev)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS no permitido'));
  },
  credentials: true
}));

// ── Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ──────────────────────────────────────────────
// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const morganStream = {
  write: (message) => logger.info(message.trim())
};

app.use(morgan(
  process.env.NODE_ENV === 'production'
    ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
    : 'dev',
  { stream: process.env.NODE_ENV === 'production' ? morganStream : undefined }
));

// ── Static Files ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuarioRoutes);

// ── SPA Fallback ─────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ status: 'error', message: 'Ruta no encontrada.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      logger.info(`╔══════════════════════════════════════════╗`);
      logger.info(`║  MoraSuite POS — Servidor Iniciado       ║`);
      logger.info(`║  Puerto: ${PORT}                            ║`);
      logger.info(`║  Entorno: ${(process.env.NODE_ENV || 'development').padEnd(28)}║`);
      logger.info(`╚══════════════════════════════════════════╝`);
    });
  } catch (err) {
    console.error('ERROR CRÍTICO AL INICIAR:', err);
    process.exit(1);
  }
}

start();
