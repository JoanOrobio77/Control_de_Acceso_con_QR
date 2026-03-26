const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Estados = sequelize.define(
  'Estados',
  {
    id_estado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    tipo_aplica: {
      type: DataTypes.ENUM('aprendiz', 'instructor', 'funcionario', 'visitante'),
      allowNull: false,
    },
  },
  {
    tableName: 'Estados',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Estados;

