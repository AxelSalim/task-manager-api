'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Task, { foreignKey: "userId", as: "tasks" });
    }
  }
  User.init({
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: "User",
    timestamps: true
  });
  return User;
}