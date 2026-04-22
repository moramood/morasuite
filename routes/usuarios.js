/**
 * MoraSuite — Usuarios Routes
 */
const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate); // Require login for all routes

router.get('/', usuarioController.list);
router.put('/:id/status', usuarioController.updateStatus);

module.exports = router;
