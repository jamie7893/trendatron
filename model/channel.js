'use strict';
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('channel', {
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: false,
      autoIncrement: false,
      unique: false
    },
    viewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: false,
      primaryKey: false
    },
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: false
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: false
    },
    currentPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: false
    },
    lottery: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: false
    },
    tickets: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      unique: false
    }
  }, {
    tableName: 'channel',
    freezeTableName: true,
    timestamps: false
  });
};
