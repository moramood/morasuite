/**
 * MoraSuite — Venta Model
 * Uses database transactions for atomic operations.
 * Sequential invoice numbering via configuracion table.
 */
const { pool } = require('../config/database');
const logger = require('../config/logger');

const Venta = {
  /**
   * Create a sale with full transaction:
   * 1. Lock & increment invoice number
   * 2. Insert venta
   * 3. Insert detalle_ventas
   * 4. Update stock (with race condition prevention via row-level locks)
   * 5. Add loyalty points to client
   */
  async create({ cliente_id, items, usuario_id }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Get next invoice number with row lock
      const [configRows] = await conn.execute(
        `SELECT valor FROM configuracion WHERE clave = 'ultimo_numero_factura' FOR UPDATE`
      );
      const nextInvoice = parseInt(configRows[0].valor) + 1;
      await conn.execute(
        `UPDATE configuracion SET valor = ? WHERE clave = 'ultimo_numero_factura'`,
        [String(nextInvoice)]
      );

      // 2. Calculate total
      let total = 0;
      for (const item of items) {
        total += item.precio_unitario * item.cantidad;
      }

      // 3. Insert venta
      const [ventaResult] = await conn.execute(
        `INSERT INTO ventas (numero_factura, cliente_id, total, usuario_id) VALUES (?, ?, ?, ?)`,
        [nextInvoice, cliente_id || null, total, usuario_id || null]
      );
      const ventaId = ventaResult.insertId;

      // 4. Insert details and update stock with row locks
      for (const item of items) {
        const subtotal = item.precio_unitario * item.cantidad;

        await conn.execute(
          `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, total)
           VALUES (?, ?, ?, ?, ?)`,
          [ventaId, item.producto_id, item.cantidad, item.precio_unitario, subtotal]
        );

        // Lock row and update stock
        const [stockRows] = await conn.execute(
          `SELECT stock FROM productos WHERE id = ? FOR UPDATE`,
          [item.producto_id]
        );
        if (stockRows.length === 0) {
          throw new Error(`Producto ID ${item.producto_id} no encontrado.`);
        }
        const currentStock = stockRows[0].stock;
        if (currentStock < item.cantidad) {
          throw new Error(`Stock insuficiente para producto ID ${item.producto_id}. Disponible: ${currentStock}, solicitado: ${item.cantidad}`);
        }
        await conn.execute(
          `UPDATE productos SET stock = stock - ? WHERE id = ?`,
          [item.cantidad, item.producto_id]
        );
      }

      // 5. Add loyalty points if client
      let puntos_ganados = 0;
      if (cliente_id) {
        const puntosRate = parseInt(process.env.PUNTOS_POR_PESO || '1000');
        puntos_ganados = Math.floor(total / puntosRate);
        if (puntos_ganados > 0) {
          await conn.execute(
            `UPDATE clientes SET puntos = puntos + ? WHERE id = ?`,
            [puntos_ganados, cliente_id]
          );
        }
      }

      console.log("total amount:", total);
      console.log("calculated points:", puntos_ganados);
      console.log("client_id:", cliente_id);

      await conn.commit();

      logger.info(`Venta #${nextInvoice} creada. Total: $${total}. Puntos: ${puntos_ganados}. ID: ${ventaId}`);

      return {
        id: ventaId,
        numero_factura: nextInvoice,
        cliente_id,
        total,
        puntos_ganados,
        usuario_id,
        items
      };
    } catch (err) {
      await conn.rollback();
      logger.error(`Error en transacción de venta: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * List sales with pagination.
   */
  async findAll({ search = '', page = 1, limit = 20, offset = 0 } = {}) {
    let where = '';
    const params = [];

    if (search) {
      where = `WHERE v.numero_factura LIKE ? OR c.nombre LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT v.*, c.nombre as cliente_nombre, COALESCE(u.nombre_mostrar, u.username) as cajero
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       ${where}
       ORDER BY v.fecha DESC
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Get a single sale with its details.
   */
  async findById(id) {
    const [ventaRows] = await pool.execute(
      `SELECT v.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono,
              COALESCE(u.nombre_mostrar, u.username) as cajero
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?`,
      [id]
    );
    if (ventaRows.length === 0) return null;

    const [detalles] = await pool.execute(
      `SELECT dv.*, p.nombre as producto_nombre
       FROM detalle_ventas dv
       JOIN productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = ?`,
      [id]
    );

    return { ...ventaRows[0], detalles };
  }
};

module.exports = Venta;
