/**
 * MoraSuite — Venta Controller
 */
const Venta = require('../models/Venta');
const { AppError } = require('../middleware/errorHandler');
const { requireFields, parsePagination } = require('../middleware/validate');

const ventaController = {
  /**
   * GET /api/ventas
   */
  async list(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const search = req.query.search || '';
      const result = await Venta.findAll({ search, page, limit, offset });
      res.json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/ventas/:id
   */
  async getOne(req, res, next) {
    try {
      const venta = await Venta.findById(req.params.id);
      if (!venta) throw new AppError('Venta no encontrada.', 404);
      res.json({ status: 'success', data: venta });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/ventas
   * Body: { cliente_id, items: [{ producto_id, cantidad, precio_unitario }] }
   */
  async create(req, res, next) {
    try {
      requireFields(req.body, ['items']);

      const { cliente_id, items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError('Debe incluir al menos un producto.', 400);
      }

      for (const item of items) {
        if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
          throw new AppError('Cada item debe tener producto_id, cantidad y precio_unitario.', 400);
        }
        if (item.cantidad <= 0) {
          throw new AppError('La cantidad debe ser mayor a 0.', 400);
        }
      }

      const venta = await Venta.create({
        cliente_id: cliente_id || null,
        items,
        usuario_id: req.user.id
      });

      res.status(201).json({
        status: 'success',
        message: `Venta #${venta.numero_factura} creada exitosamente.`,
        data: venta
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ventaController;
