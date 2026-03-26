const { body, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Validaciones para scan QR
 */
const validateScan = [
  body('qr')
    .notEmpty()
    .withMessage('El código QR es requerido')
    .isString()
    .withMessage('El código QR debe ser una cadena de texto'),
  body('tipo')
    .optional()
    .isIn(['entrada', 'salida'])
    .withMessage('El tipo debe ser "entrada" o "salida"'),
  body('areaId')
    .optional()
    .isInt()
    .withMessage('El ID del área debe ser un número entero'),
  handleValidationErrors,
];

/**
 * Validaciones para registro manual
 */
const validateManual = [
  body('identificacion')
    .notEmpty()
    .withMessage('La identificación es requerida')
    .isString()
    .withMessage('La identificación debe ser una cadena de texto')
    .isLength({ min: 5, max: 20 })
    .withMessage('La identificación debe tener entre 5 y 20 caracteres'),
  body('tipo')
    .optional()
    .isIn(['entrada', 'salida'])
    .withMessage('El tipo debe ser "entrada" o "salida"'),
  body('areaId')
    .optional()
    .isInt()
    .withMessage('El ID del área debe ser un número entero'),
  body('descripcion')
    .optional()
    .isString()
    .withMessage('La descripción debe ser una cadena de texto'),
  handleValidationErrors,
];

/**
 * Validaciones para listar registros (query params)
 */
const validateList = [
  query('userId')
    .optional()
    .isInt()
    .withMessage('El ID del usuario debe ser un número entero'),
  query('areaId')
    .optional()
    .isInt()
    .withMessage('El ID del área debe ser un número entero'),
  query('tipo')
    .optional()
    .isIn(['entrada', 'salida'])
    .withMessage('El tipo debe ser "entrada" o "salida"'),
  query('fechaDesde')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe ser una fecha válida (ISO 8601)'),
  query('fechaHasta')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe ser una fecha válida (ISO 8601)'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El tamaño debe ser un número entre 1 y 100'),
  handleValidationErrors,
];

module.exports = {
  validateScan,
  validateManual,
  validateList,
};

