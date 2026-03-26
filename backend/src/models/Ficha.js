const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ficha = sequelize.define(
  'Ficha',
  {
    id_ficha: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    numero_ficha: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    programa_formacion: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ambiente: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jornada: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    id_instructor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Personas',
        key: 'id_persona',
      },
    },
  },
  {
    tableName: 'Ficha',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Ficha;

