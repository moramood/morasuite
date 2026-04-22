/**
 * MoraSuite — Usuario Model
 */
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const Usuario = {
  /**
   * Find user by username for login.
   */
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT id, username, password, nombre_mostrar, documento, role, status FROM usuarios WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  /**
   * Verify password against bcrypt hash.
   */
  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  /**
   * Get user by ID (without password).
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, nombre_mostrar, documento, role, status, created_at FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create pending user (registration).
   */
  async createPending(username, password, nombre_mostrar, documento) {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (username, password, nombre_mostrar, documento, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hash, nombre_mostrar, documento, 'cajero', 'pending']
    );
    return result.insertId;
  },

  /**
   * Get all users.
   */
  async findAll() {
    const [rows] = await pool.execute('SELECT id, username, nombre_mostrar, documento, role, status, created_at FROM usuarios ORDER BY created_at DESC');
    return rows;
  },

  /**
   * Update status.
   */
  async updateStatus(id, status) {
    await pool.execute('UPDATE usuarios SET status = ? WHERE id = ?', [status, id]);
  }
};

module.exports = Usuario;
