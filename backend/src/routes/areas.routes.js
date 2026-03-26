const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');

router.get('/', areaController.obtenerAreas);
router.post('/', areaController.crearArea);
router.put('/:id', areaController.actualizarArea);
router.delete('/:id', areaController.eliminarArea);

module.exports = router;

