'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FinanceSavingsGoal extends Model {
    static associate(models) {
      FinanceSavingsGoal.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      FinanceSavingsGoal.hasMany(models.FinanceSavingsContribution, {
        foreignKey: 'goalId',
        as: 'contributions',
      });
    }
  }
  FinanceSavingsGoal.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      targetAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          const v = this.getDataValue('targetAmount');
          return v != null ? Number(v) : null;
        },
      },
    },
    {
      sequelize,
      modelName: 'FinanceSavingsGoal',
      tableName: 'FinanceSavingsGoals',
      timestamps: true,
    }
  );
  return FinanceSavingsGoal;
};
