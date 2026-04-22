/**
 * MoraSuite — Producto Model
 */
const { pool } = require('../config/database');

const Producto = {
  /**
   * List products with pagination and search.
   */
  async findAll({ search = '', page = 1, limit = 20, offset = 0 } = {}) {
    let where = '';
    const params = [];

    if (search) {
      where = 'WHERE nombre LIKE ? OR descripcion LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM productos ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT * FROM productos ${where} ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Get all products (no pagination — for POS grid).
   */
  async findAllSimple() {
    const [rows] = await pool.execute(
      'SELECT id, nombre, descripcion, precio, stock FROM productos ORDER BY nombre ASC'
    );
    return rows;
  },

  /**
   * Find product by ID.
   */
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM productos WHERE id = ?', [id]);
    return rows[0] || null;
  },

  /**
   * Create a new product.
   */
  async create({ nombre, descripcion, precio, stock }) {
    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
      [nombre, descripcion || null, precio, stock || 0]
    );
    return { id: result.insertId, nombre, descripcion, precio, stock };
  },

  /**
   * Update an existing product.
   */
  async update(id, { nombre, descripcion, precio, stock }) {
    await pool.execute(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?',
      [nombre, descripcion || null, precio, stock, id]
    );
    return this.findById(id);
  },

  /**
   * Delete a product.
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM productos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Producto;
