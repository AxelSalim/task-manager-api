'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }
  Task.init({
    title: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM("todo", "in-progress", "done"), defaultValue: "todo" },
  }, {
    sequelize,
    modelName: "Task",
    timestamps: true
  });
  return Task;
}

