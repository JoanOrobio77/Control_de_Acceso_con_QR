const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Roles = sequelize.define(
  'Roles',
  {
    id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_rol: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    permite_login: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'Roles',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Roles;

