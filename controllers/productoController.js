/**
 * MoraSuite — Producto Controller
 */
const Producto = require('../models/Producto');
const { AppError } = require('../middleware/errorHandler');
const { requireFields, sanitize, requirePositiveNumber, requirePositiveInt, parsePagination } = require('../middleware/validate');

const productoController = {
  /**
   * GET /api/productos
   */
  async list(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const search = req.query.search || '';
      const result = await Producto.findAll({ search, page, limit, offset });
      res.json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/productos/all — For POS (no pagination)
   */
  async listAll(req, res, next) {
    try {
      const data = await Producto.findAllSimple();
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/productos/:id
   */
  async getOne(req, res, next) {
    try {
      const product = await Producto.findById(req.params.id);
      if (!product) throw new AppError('Producto no encontrado.', 404);
      res.json({ status: 'success', data: product });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/productos
   */
  async create(req, res, next) {
    try {
      requireFields(req.body, ['nombre', 'precio']);
      const data = {
        nombre: sanitize(req.body.nombre),
        descripcion: sanitize(req.body.descripcion || ''),
        precio: requirePositiveNumber(req.body.precio, 'Precio'),
        stock: requirePositiveInt(req.body.stock || 0, 'Stock')
      };
      const product = await Producto.create(data);
      res.status(201).json({ status: 'success', message: 'Producto creado.', data: product });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/productos/:id
   */
  async update(req, res, next) {
    try {
      requireFields(req.body, ['nombre', 'precio']);
      const existing = await Producto.findById(req.params.id);
      if (!existing) throw new AppError('Producto no encontrado.', 404);

      const data = {
        nombre: sanitize(req.body.nombre),
        descripcion: sanitize(req.body.descripcion || ''),
        precio: requirePositiveNumber(req.body.precio, 'Precio'),
        stock: requirePositiveInt(req.body.stock ?? existing.stock, 'Stock')
      };
      const product = await Producto.update(req.params.id, data);
      res.json({ status: 'success', message: 'Producto actualizado.', data: product });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/productos/:id
   */
  async delete(req, res, next) {
    try {
      const deleted = await Producto.delete(req.params.id);
      if (!deleted) throw new AppError('Producto no encontrado.', 404);
      res.json({ status: 'success', message: 'Producto eliminado.' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = productoController;
