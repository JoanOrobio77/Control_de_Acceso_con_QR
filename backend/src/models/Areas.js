const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Areas = sequelize.define(
  'Areas',
  {
    id_area: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    descripcion: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: 'Areas',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Areas;

