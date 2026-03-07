'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Habit extends Model {
    static associate(models) {
      Habit.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Habit.hasMany(models.HabitCompletion, {
        foreignKey: 'habitId',
        as: 'completions',
      });
    }
  }
  Habit.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'Habit',
      tableName: 'Habits',
      timestamps: true,
    }
  );
  return Habit;
};
