const { Usuarios, Roles } = require("../models");



// Crear visitante

exports.crearVisitante = async (req, res) => {

  try {

    const { nombre, identificacion, telefono, correo } = req.body;



    // Rol visitante (debe existir previamente en Roles)

    const rolVisitante = await Roles.findOne({ where: { nombre_rol: "visitante" } });



    if (!rolVisitante) {

      return res.status(400).json({ message: "El rol 'visitante' no existe. Debes crearlo primero." });

    }



    const nuevoVisitante = await Usuarios.create({

      nombre,

      identificacion,

      telefono,

      correo,

      id_rol: rolVisitante.id_rol,

      id_ficha: null

    });



    return res.json(nuevoVisitante);

  } catch (error) {

    return res.status(500).json({ message: "Error creando visitante", error });

  }

};



// Listar visitantes

exports.getVisitantes = async (req, res) => {

  try {

    const visitantes = await Usuarios.findAll({

      include: [{ model: Roles }],

      where: {},

    });



    return res.json(visitantes);

  } catch (error) {

    return res.status(500).json({ message: "Error obteniendo visitantes", error });

  }

};



// Actualizar visitante

exports.updateVisitante = async (req, res) => {

  try {

    const { id } = req.params;

    const data = req.body;



    const visitante = await Usuarios.findByPk(id);

    if (!visitante) return res.status(404).json({ message: "Visitante no encontrado" });



    await visitante.update(data);

    return res.json(visitante);

  } catch (error) {

    return res.status(500).json({ message: "Error actualizando visitante", error });

  }

};



// Eliminar visitante

exports.deleteVisitante = async (req, res) => {

  try {

    const { id } = req.params;



    const visitante = await Usuarios.findByPk(id);

    if (!visitante) return res.status(404).json({ message: "Visitante no encontrado" });



    await visitante.destroy();

    return res.json({ message: "Visitante eliminado" });

  } catch (error) {

    return res.status(500).json({ message: "Error eliminando visitante", error });

  }

};

