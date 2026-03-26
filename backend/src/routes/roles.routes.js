const express = require('express');

const router = express.Router();



const {

  getRoles,

  createRole,

  updateRole,

  deleteRole,

} = require('../controllers/roles.controller');



// Rutas CRUD

router.get('/', getRoles);

router.post('/', createRole);

router.put('/:id', updateRole);

router.delete('/:id', deleteRole);



module.exports = router;

