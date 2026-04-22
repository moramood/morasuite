/**
 * MoraSuite — Cliente Model
 */
const { pool } = require('../config/database');

const Cliente = {
  /**
   * List clients with pagination and search.
   */
  async findAll({ search = '', page = 1, limit = 20, offset = 0 } = {}) {
    let where = '';
    const params = [];

    if (search) {
      where = 'WHERE nombre LIKE ? OR telefono LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM clientes ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT * FROM clientes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Get all clients (for POS autocomplete).
   */
  async findAllSimple() {
    const [rows] = await pool.execute(
      'SELECT id, nombre, telefono, email, puntos FROM clientes ORDER BY nombre ASC'
    );
    return rows;
  },

  /**
   * Find client by ID.
   */
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM clientes WHERE id = ?', [id]);
    return rows[0] || null;
  },

  /**
   * Create client.
   */
  async create({ nombre, telefono, email }) {
    const [result] = await pool.execute(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      [nombre, telefono || null, email || null]
    );
    return { id: result.insertId, nombre, telefono, email, puntos: 0 };
  },

  /**
   * Update client.
   */
  async update(id, { nombre, telefono, email }) {
    await pool.execute(
      'UPDATE clientes SET nombre = ?, telefono = ?, email = ? WHERE id = ?',
      [nombre, telefono || null, email || null, id]
    );
    return this.findById(id);
  },

  /**
   * Delete client.
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM clientes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Add loyalty points to a client.
   */
  async addPoints(id, points) {
    await pool.execute(
      'UPDATE clientes SET puntos = puntos + ? WHERE id = ?',
      [points, id]
    );
  }
};

module.exports = Cliente;
