/**
 * MoraSuite — Cliente Routes
 */
const express = require('express');
const clienteController = require('../controllers/clienteController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', clienteController.list);
router.get('/all', clienteController.listAll);
router.get('/:id', clienteController.getOne);

router.post('/', clienteController.create);
router.put('/:id', authorize('admin'), clienteController.update);
router.delete('/:id', authorize('admin'), clienteController.delete);

module.exports = router;
