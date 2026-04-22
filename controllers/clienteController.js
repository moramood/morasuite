/**
 * MoraSuite — Cliente Controller
 */
const Cliente = require('../models/Cliente');
const { AppError } = require('../middleware/errorHandler');
const { requireFields, sanitize, parsePagination } = require('../middleware/validate');

const clienteController = {
  /**
   * GET /api/clientes
   */
  async list(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const search = req.query.search || '';
      const result = await Cliente.findAll({ search, page, limit, offset });
      res.json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/clientes/all — For POS autocomplete
   */
  async listAll(req, res, next) {
    try {
      const data = await Cliente.findAllSimple();
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/clientes/:id
   */
  async getOne(req, res, next) {
    try {
      const client = await Cliente.findById(req.params.id);
      if (!client) throw new AppError('Cliente no encontrado.', 404);
      res.json({ status: 'success', data: client });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/clientes
   */
  async create(req, res, next) {
    try {
      requireFields(req.body, ['nombre']);
      const data = {
        nombre: sanitize(req.body.nombre),
        telefono: sanitize(req.body.telefono || ''),
        email: sanitize(req.body.email || '')
      };
      const client = await Cliente.create(data);
      res.status(201).json({ status: 'success', message: 'Cliente creado.', data: client });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/clientes/:id
   */
  async update(req, res, next) {
    try {
      requireFields(req.body, ['nombre']);
      const existing = await Cliente.findById(req.params.id);
      if (!existing) throw new AppError('Cliente no encontrado.', 404);

      const data = {
        nombre: sanitize(req.body.nombre),
        telefono: sanitize(req.body.telefono || ''),
        email: sanitize(req.body.email || '')
      };
      const client = await Cliente.update(req.params.id, data);
      res.json({ status: 'success', message: 'Cliente actualizado.', data: client });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/clientes/:id
   */
  async delete(req, res, next) {
    try {
      const deleted = await Cliente.delete(req.params.id);
      if (!deleted) throw new AppError('Cliente no encontrado.', 404);
      res.json({ status: 'success', message: 'Cliente eliminado.' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = clienteController;
