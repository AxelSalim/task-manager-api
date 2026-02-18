'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Task.belongsToMany(models.Tag, {
        through: 'TaskTags',
        foreignKey: 'taskId',
        otherKey: 'tagId',
        as: 'tags'
      });
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
    reminderDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    repeatPattern: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('repeatPattern');
        if (!rawValue) return null;
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return null;
        }
      },
      set(value) {
        this.setDataValue('repeatPattern', value ? JSON.stringify(value) : null);
      }
    },
    subtasks: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('subtasks');
        if (!rawValue) return [];
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      },
      set(value) {
        this.setDataValue('subtasks', JSON.stringify(value || []));
      }
    },
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Durée estimée en minutes (Est, type Blitzit)',
    },
    spentMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Temps passé en minutes (Done, type Blitzit)',
    },
  }, {
    sequelize,
    modelName: "Task",
    timestamps: true,
  });
  return Task;
}

