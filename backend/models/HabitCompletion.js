'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HabitCompletion extends Model {
    static associate(models) {
      HabitCompletion.belongsTo(models.Habit, { foreignKey: 'habitId', as: 'habit' });
      HabitCompletion.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  HabitCompletion.init(
    {
      habitId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
      sequelize,
      modelName: 'HabitCompletion',
      tableName: 'HabitCompletions',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['habitId', 'date'] },
        { fields: ['userId', 'date'] },
      ],
    }
  );
  return HabitCompletion;
};
