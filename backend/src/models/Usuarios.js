const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuarios = sequelize.define(
  'Usuarios',
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_usuario: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    correo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    id_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id_rol',
      },
    },
  },
  {
    tableName: 'Usuarios',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Usuarios;

