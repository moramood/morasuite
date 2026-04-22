/**
 * MoraSuite — MySQL Database Connection + Auto-Migration
 * Creates tables IF NOT EXISTS — does NOT create the database itself.
 * Run database.sql manually first.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const logger = require('./logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'morasuite_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-05:00'
});

/**
 * Creates tables if they don't exist and seeds the admin user.
 */
async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    logger.info('Verificando tablas de base de datos...');

    // 1. USUARIOS
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id              INT             NOT NULL AUTO_INCREMENT,
        username        VARCHAR(80)     NOT NULL,
        password        VARCHAR(255)    NOT NULL,
        nombre_mostrar  VARCHAR(150)    DEFAULT NULL,
        documento       VARCHAR(50)     DEFAULT NULL,
        role            ENUM('admin','cajero') NOT NULL DEFAULT 'cajero',
        status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
        created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure 'status', 'nombre_mostrar', and 'documento' columns in usuarios
    try {
      await conn.execute("ALTER TABLE usuarios ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved';");
      logger.info('Columna status añadida a tabla usuarios.');
    } catch (e) {}
    try {
      await conn.execute("ALTER TABLE usuarios ADD COLUMN nombre_mostrar VARCHAR(150) DEFAULT NULL;");
      logger.info('Columna nombre_mostrar añadida a tabla usuarios.');
    } catch (e) {}
    try {
      await conn.execute("ALTER TABLE usuarios ADD COLUMN documento VARCHAR(50) DEFAULT NULL;");
      logger.info('Columna documento añadida a tabla usuarios.');
    } catch (e) {}

    // 2. PRODUCTOS
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id              INT             NOT NULL AUTO_INCREMENT,
        nombre          VARCHAR(150)    NOT NULL,
        descripcion     TEXT            DEFAULT NULL,
        precio          DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
        stock           INT             NOT NULL DEFAULT 0,
        fecha_creacion  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. CLIENTES
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS clientes (
        id              INT             NOT NULL AUTO_INCREMENT,
        nombre          VARCHAR(120)    NOT NULL,
        telefono        VARCHAR(20)     DEFAULT NULL,
        email           VARCHAR(180)    DEFAULT NULL,
        puntos          INT             NOT NULL DEFAULT 0,
        created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. VENTAS
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id              INT             NOT NULL AUTO_INCREMENT,
        numero_factura  INT             NOT NULL,
        cliente_id      INT             DEFAULT NULL,
        total           DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
        fecha           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        usuario_id      INT             DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_factura (numero_factura),
        KEY idx_ventas_cliente (cliente_id),
        KEY idx_ventas_usuario (usuario_id),
        CONSTRAINT fk_ventas_cliente
          FOREIGN KEY (cliente_id) REFERENCES clientes(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_ventas_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure 'puntos' column in clientes
    try {
      await conn.execute("ALTER TABLE clientes ADD COLUMN puntos INT NOT NULL DEFAULT 0;");
      logger.info('Columna puntos añadida a tabla clientes.');
    } catch (e) {
      // Ignore if it already exists
    }


    // 5. DETALLE_VENTAS
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS detalle_ventas (
        id              INT             NOT NULL AUTO_INCREMENT,
        venta_id        INT             NOT NULL,
        producto_id     INT             NOT NULL,
        cantidad        INT             NOT NULL DEFAULT 1,
        precio_unitario DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
        total           DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
        PRIMARY KEY (id),
        KEY idx_detalle_venta (venta_id),
        KEY idx_detalle_producto (producto_id),
        CONSTRAINT fk_detalle_venta
          FOREIGN KEY (venta_id) REFERENCES ventas(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_detalle_producto
          FOREIGN KEY (producto_id) REFERENCES productos(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 6. CONFIGURACION (sequential invoice counter + settings)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave           VARCHAR(80)     NOT NULL,
        valor           VARCHAR(255)    NOT NULL DEFAULT '',
        PRIMARY KEY (clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

 // Seed admin user if not exists
const [adminRows] = await conn.execute(
  `SELECT id FROM usuarios WHERE username = 'AdminMora'`
);

if (adminRows.length === 0) {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('Falta ADMIN_PASSWORD en variables de entorno');
  }

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

  await conn.execute(
    `INSERT INTO usuarios (username, password, role) VALUES (?, ?, 'admin')`,
    ['AdminMora', hashedPassword]
  );

  logger.info('Usuario AdminMora creado correctamente.');
}

    logger.info('Base de datos inicializada correctamente.');
  } catch (err) {
    logger.error('Error inicializando base de datos:', err);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDatabase };
