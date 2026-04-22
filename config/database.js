/**
 * MoraSuite — MySQL Database Connection + Auto-Migration
 * Creates tables IF NOT EXISTS — does NOT create the database itself.
 * Run database.sql manually first.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const logger = require('./logger');

function createPool() {
  // 👉 Railway
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);

    return mysql.createPool({
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }

  // 👉 Local
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'morasuite_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });
}

const pool = createPool();

async function initDatabase() {
  const conn = await pool.getConnection();

  try {
    logger.info('Inicializando base de datos...');

    // Tabla usuarios (mínima para que no falle)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100),
        password VARCHAR(255),
        role VARCHAR(20)
      )
    `);

    // Crear admin si no existe
    const [rows] = await conn.execute(
      `SELECT id FROM usuarios WHERE username = 'AdminMora'`
    );

    if (rows.length === 0) {
      if (!process.env.ADMIN_PASSWORD) {
        throw new Error('ADMIN_PASSWORD no definido');
      }

      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      await conn.execute(
        `INSERT INTO usuarios (username, password, role) VALUES (?, ?, 'admin')`,
        ['AdminMora', hash]
      );

      logger.info('Usuario admin creado');
    }

    logger.info('Base de datos lista');
  } catch (err) {
    console.error('ERROR DB:', err);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDatabase };
