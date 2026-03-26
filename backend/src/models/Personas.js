const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Personas = sequelize.define(
  'Personas',
  {
    id_persona: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    numero_documento: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    foto: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    correo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    rh: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    id_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id_rol',
      },
    },
    id_estado: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Estados',
        key: 'id_estado',
      },
    },
  },
  {
    tableName: 'Personas',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Personas;

