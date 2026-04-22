/**
 * MoraSuite — Usuario Controller (Admin Only)
 */
const Usuario = require('../models/Usuario');
const { AppError } = require('../middleware/errorHandler');

const usuarioController = {
  /**
   * GET /api/usuarios
   */
  async list(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        throw new AppError('Acceso denegado. Solo administradores.', 403);
      }
      const data = await Usuario.findAll();
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/usuarios/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        throw new AppError('Acceso denegado. Solo administradores.', 403);
      }
      const status = req.body.status;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        throw new AppError('Estado no válido.', 400);
      }
      
      // Basic check to prevent admin from rejecting themselves
      if (parseInt(req.params.id) === req.user.id && status !== 'approved') {
        throw new AppError('No puedes cambiar el estado de tu propia cuenta de administrador.', 400);
      }

      await Usuario.updateStatus(req.params.id, status);
      
      // Fetch updated
      const updated = await Usuario.findById(req.params.id);
      res.json({ status: 'success', message: 'Estado del usuario actualizado.', data: updated });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = usuarioController;
