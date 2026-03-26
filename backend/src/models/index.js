const sequelize = require('../config/db');
const Ficha = require('./Ficha');
const Roles = require('./Roles');
const Usuarios = require('./Usuarios');
const Areas = require('./Areas');
const Personas = require('./Personas');
const Registro_Acceso = require('./Registro_Acceso');
const Estudiante = require('./Estudiante');
const Estados = require('./Estados');

// Asociaciones
// Nota: La tabla Usuarios ya no tiene relación con Ficha según la nueva estructura
// Los aprendices están en la tabla Aprendices/Estudiantes

// Roles -> Usuarios (uno a muchos)
Roles.hasMany(Usuarios, {
  foreignKey: 'id_rol',
  as: 'usuarios',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Usuarios.belongsTo(Roles, {
  foreignKey: 'id_rol',
  as: 'rol',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// Roles -> Personas (uno a muchos)
Roles.hasMany(Personas, {
  foreignKey: 'id_rol',
  as: 'personas',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Personas.belongsTo(Roles, {
  foreignKey: 'id_rol',
  as: 'rol',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// Roles -> Estudiantes (uno a muchos)
Roles.hasMany(Estudiante, {
  foreignKey: 'id_rol',
  as: 'estudiantes',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Estudiante.belongsTo(Roles, {
  foreignKey: 'id_rol',
  as: 'rol',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// Estados -> Personas
Estados.hasMany(Personas, {
  foreignKey: 'id_estado',
  as: 'personas',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Personas.belongsTo(Estados, {
  foreignKey: 'id_estado',
  as: 'estado',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Estados -> Estudiantes
Estados.hasMany(Estudiante, {
  foreignKey: 'id_estado',
  as: 'estudiantes',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Estudiante.belongsTo(Estados, {
  foreignKey: 'id_estado',
  as: 'estado',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// Personas -> Registro_Acceso (uno a muchos)
Personas.hasMany(Registro_Acceso, {
  foreignKey: 'id_persona',
  as: 'registros_acceso',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Registro_Acceso.belongsTo(Personas, {
  foreignKey: 'id_persona',
  as: 'persona',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Personas -> Ficha (uno a muchos) - Instructor
Personas.hasMany(Ficha, {
  foreignKey: 'id_instructor',
  as: 'fichas',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Ficha.belongsTo(Personas, {
  foreignKey: 'id_instructor',
  as: 'instructor',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Ficha -> Estudiantes (uno a muchos) - Aprendices
Ficha.hasMany(Estudiante, {
  foreignKey: 'id_ficha',
  as: 'estudiantes',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Estudiante.belongsTo(Ficha, {
  foreignKey: 'id_ficha',
  as: 'ficha',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Areas -> Registro_Acceso (uno a muchos)
Areas.hasMany(Registro_Acceso, {
  foreignKey: 'id_area',
  as: 'registros_acceso',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Registro_Acceso.belongsTo(Areas, {
  foreignKey: 'id_area',
  as: 'area',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = {
  sequelize,
  Ficha,
  Roles,
  Usuarios,
  Areas,
  Personas,
  Registro_Acceso,
  Estudiante,
  Estados,
};

