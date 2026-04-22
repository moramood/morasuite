/**
 * MoraSuite — Venta Routes
 */
const express = require('express');
const ventaController = require('../controllers/ventaController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', ventaController.list);
router.get('/:id', ventaController.getOne);
router.post('/', ventaController.create);

module.exports = router;
