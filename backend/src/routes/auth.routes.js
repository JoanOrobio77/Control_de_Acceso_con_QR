const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegisterAdmin, validateLogin } = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * POST /api/auth/register-admin
 * Registro de administrador (solo accesible inicialmente por seed o manual)
 */
router.post('/register-admin', validateRegisterAdmin, authController.registerAdmin);

/**
 * POST /api/auth/login
 * Login de usuario
 */
router.post('/login', validateLogin, authController.login);

/**
 * POST /api/auth/register
 * Registro general de usuario
 */
router.post('/register', authController.register);

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;

