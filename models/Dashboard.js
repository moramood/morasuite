/**
 * MoraSuite — Dashboard Model
 */
const { pool } = require('../config/database');

const Dashboard = {
  /**
   * Get today's stats: total sales, count, average ticket.
   */
  async getStats() {
    const [[stats]] = await pool.execute(`
      SELECT
        COALESCE(SUM(total), 0) as ventas_total,
        COUNT(*) as ventas_count,
        COALESCE(AVG(total), 0) as ticket_promedio
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    const [[allTime]] = await pool.execute(`
      SELECT COUNT(*) as total_historico FROM ventas
    `);

    const [[clientCount]] = await pool.execute(`
      SELECT COUNT(*) as total FROM clientes
    `);

    const [[productCount]] = await pool.execute(`
      SELECT COUNT(*) as total FROM productos
    `);

    return {
      hoy: {
        ventas_total: parseFloat(stats.ventas_total),
        ventas_count: stats.ventas_count,
        ticket_promedio: parseFloat(stats.ticket_promedio)
      },
      total_historico: allTime.total_historico,
      total_clientes: clientCount.total,
      total_productos: productCount.total
    };
  },

  /**
   * Get top-selling products.
   */
  async getTopProducts(limit = 5) {
    const [rows] = await pool.execute(`
      SELECT p.nombre, SUM(dv.cantidad) as unidades, SUM(dv.total) as ingresos
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      GROUP BY dv.producto_id, p.nombre
      ORDER BY unidades DESC
      LIMIT ?
    `, [String(limit)]);
    return rows;
  },

  /**
   * Get recent sales.
   */
  async getRecentSales(limit = 10) {
    const [rows] = await pool.execute(`
      SELECT v.id, v.numero_factura, v.total, v.fecha,
             c.nombre as cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
      LIMIT ?
    `, [String(limit)]);
    return rows;
  },

  /**
   * Get hourly sales for today.
   */
  async getHourlySales() {
    const [rows] = await pool.execute(`
      SELECT HOUR(fecha) as hora, SUM(total) as total
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
      GROUP BY HOUR(fecha)
      ORDER BY hora ASC
    `);
    return rows;
  }
};

module.exports = Dashboard;
