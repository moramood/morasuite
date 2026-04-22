/**
 * MoraSuite — Dashboard Controller
 */
const Dashboard = require('../models/Dashboard');

const dashboardController = {
  /**
   * GET /api/dashboard/stats
   */
  async stats(req, res, next) {
    try {
      const stats = await Dashboard.getStats();
      res.json({ status: 'success', data: stats });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/top-products
   */
  async topProducts(req, res, next) {
    try {
      const data = await Dashboard.getTopProducts();
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/recent-sales
   */
  async recentSales(req, res, next) {
    try {
      const data = await Dashboard.getRecentSales();
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/dashboard/hourly
   */
  async hourlySales(req, res, next) {
    try {
      const data = await Dashboard.getHourlySales();
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = dashboardController;
