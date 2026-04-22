/**
 * MoraSuite — Input Validation Helpers
 */
const { AppError } = require('./errorHandler');

/**
 * Validates that required fields are present and non-empty strings.
 * @param {object} body - req.body
 * @param {string[]} fields - field names
 */
function requireFields(body, fields) {
  const missing = fields.filter(f => {
    const val = body[f];
    return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
  });
  if (missing.length > 0) {
    throw new AppError(`Campos requeridos faltantes: ${missing.join(', ')}`, 400);
  }
}

/**
 * Sanitize a string value.
 */
function sanitize(val) {
  if (typeof val !== 'string') return val;
  return val.trim().replace(/[<>]/g, '');
}

/**
 * Validate that a value is a positive number.
 */
function requirePositiveNumber(val, fieldName) {
  const num = Number(val);
  if (isNaN(num) || num < 0) {
    throw new AppError(`${fieldName} debe ser un número positivo.`, 400);
  }
  return num;
}

/**
 * Validate that value is a positive integer.
 */
function requirePositiveInt(val, fieldName) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 0) {
    throw new AppError(`${fieldName} debe ser un entero positivo.`, 400);
  }
  return num;
}

/**
 * Validate pagination params, return { page, limit, offset }
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { requireFields, sanitize, requirePositiveNumber, requirePositiveInt, parsePagination };
