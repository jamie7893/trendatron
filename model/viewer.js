'use strict';
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('viewer', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    display: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: false
    }
  }, {
    tableName: 'viewer',
    freezeTableName: true,
    timestamps: false
  });
};
