/**
 * MoraSuite — JWT Authentication Middleware (httpOnly cookies)
 */
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Verifies JWT from httpOnly cookie. Attaches req.user = { id, username, role }
 */
function authenticate(req, res, next) {
  const token = req.cookies && req.cookies.ms_token;
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No autenticado.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    logger.warn(`Token inválido: ${err.message}`);
    return res.status(401).json({ status: 'error', message: 'Token inválido o expirado.' });
  }
}

/**
 * Role-based authorization factory.
 * Usage: authorize('admin') or authorize('admin', 'cajero')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'No tienes permisos para esta acción.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
