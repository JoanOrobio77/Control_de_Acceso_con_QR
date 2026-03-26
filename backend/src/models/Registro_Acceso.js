const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Registro_Acceso = sequelize.define(
  'Registro_Acceso',
  {
    id_registro: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_persona: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Personas',
        key: 'id_persona',
      },
    },
    id_area: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Areas',
        key: 'id_area',
      },
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora_entrada: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    hora_salida: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    tipo_acceso: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: 'Registro_Acceso',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Registro_Acceso;

