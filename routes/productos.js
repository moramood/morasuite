/**
 * MoraSuite — Producto Routes (admin only for CUD, all auth for read)
 */
const express = require('express');
const productoController = require('../controllers/productoController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', productoController.list);
router.get('/all', productoController.listAll);
router.get('/:id', productoController.getOne);

// Admin only
router.post('/', authorize('admin'), productoController.create);
router.put('/:id', authorize('admin'), productoController.update);
router.delete('/:id', authorize('admin'), productoController.delete);

module.exports = router;
