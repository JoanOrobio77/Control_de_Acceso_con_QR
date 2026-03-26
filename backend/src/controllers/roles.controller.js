const { Roles } = require('../models');



module.exports = {

  // Obtener todos los roles

  async getRoles(req, res) {

    try {

      const roles = await Roles.findAll();

      res.json(roles);

    } catch (error) {

      res.status(500).json({ error: error.message });

    }

  },



  // Crear un rol

  async createRole(req, res) {

    try {

      const { nombre_rol, estado } = req.body;



      const nuevoRol = await Roles.create({

        nombre_rol,

        estado: estado ?? true,

      });



      res.status(201).json(nuevoRol);

    } catch (error) {

      res.status(500).json({ error: error.message });

    }

  },



  // Actualizar rol

  async updateRole(req, res) {

    try {

      const { id } = req.params;



      const rol = await Roles.findByPk(id);

      if (!rol) {

        return res.status(404).json({ error: 'Rol no encontrado' });

      }



      await rol.update(req.body);

      res.json({ message: 'Rol actualizado', rol });

    } catch (error) {

      res.status(500).json({ error: error.message });

    }

  },



  // Eliminar rol

  async deleteRole(req, res) {

    try {

      const { id } = req.params;



      const rol = await Roles.findByPk(id);

      if (!rol) {

        return res.status(404).json({ error: 'Rol no encontrado' });

      }



      await rol.destroy();

      res.json({ message: 'Rol eliminado correctamente' });

    } catch (error) {

      res.status(500).json({ error: error.message });

    }

  },

};

