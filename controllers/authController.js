/**
 * MoraSuite — Auth Controller
 */
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { AppError } = require('../middleware/errorHandler');
const { requireFields, sanitize } = require('../middleware/validate');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

const authController = {
  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      requireFields(req.body, ['username', 'password']);

      const username = sanitize(req.body.username);
      const password = req.body.password;

      const user = await Usuario.findByUsername(username);
      if (!user) {
        throw new AppError('Credenciales incorrectas.', 401);
      }

      const valid = await Usuario.verifyPassword(password, user.password);
      if (!valid) {
        throw new AppError('Credenciales incorrectas.', 401);
      }

      if (user.status === 'pending') {
        throw new AppError('Tu cuenta está pendiente de aprobación por un administrador.', 401);
      }
      if (user.status === 'rejected') {
        throw new AppError('Tu solicitud de cuenta ha sido rechazada.', 401);
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, nombre_mostrar: user.nombre_mostrar, documento: user.documento },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.cookie('ms_token', token, COOKIE_OPTIONS);

      res.json({
        status: 'success',
        message: 'Login exitoso.',
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
          nombre_mostrar: user.nombre_mostrar,
          documento: user.documento
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      requireFields(req.body, ['username', 'password', 'nombre_mostrar', 'documento']);
      const username = sanitize(req.body.username);
      const password = req.body.password;
      const nombre_mostrar = sanitize(req.body.nombre_mostrar);
      const documento = sanitize(req.body.documento);

      if (password.length < 6) {
        throw new AppError('La contraseña debe tener al menos 6 caracteres.', 400);
      }

      const existing = await Usuario.findByUsername(username);
      if (existing) {
        throw new AppError('El nombre de usuario ya está en uso.', 400);
      }

      await Usuario.createPending(username, password, nombre_mostrar, documento);

      res.status(201).json({
        status: 'success',
        message: 'Cuenta creada. Pendiente de aprobación por un administrador.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    res.clearCookie('ms_token', COOKIE_OPTIONS);
    res.json({ status: 'success', message: 'Sesión cerrada.' });
  },

  /**
   * GET /api/auth/me
   */
  async me(req, res, next) {
    try {
      const user = await Usuario.findById(req.user.id);
      if (!user) {
        throw new AppError('Usuario no encontrado.', 404);
      }
      res.json({ status: 'success', data: user });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
