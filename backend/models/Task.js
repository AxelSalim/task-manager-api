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
    description: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    status: { 
      type: DataTypes.STRING, 
      defaultValue: "todo",
      allowNull: false,
      validate: {
        isIn: [["todo", "in-progress", "done"]]
      }
    },
    priority: {
      type: DataTypes.STRING,
      defaultValue: "normal",
      allowNull: true,
      validate: {
        isIn: [["low", "normal", "high", "urgent"]]
      }
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: "Task",
    timestamps: true,
  });
  return Task;
}

