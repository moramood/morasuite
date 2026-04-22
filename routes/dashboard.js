/**
 * MoraSuite — Dashboard Routes (admin only)
 */
const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', dashboardController.stats);
router.get('/top-products', dashboardController.topProducts);
router.get('/recent-sales', dashboardController.recentSales);
router.get('/hourly', dashboardController.hourlySales);

module.exports = router;
