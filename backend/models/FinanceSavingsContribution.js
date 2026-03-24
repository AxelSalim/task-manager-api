'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FinanceSavingsContribution extends Model {
    static associate(models) {
      FinanceSavingsContribution.belongsTo(models.FinanceSavingsGoal, {
        foreignKey: 'goalId',
        as: 'goal',
      });
      FinanceSavingsContribution.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  FinanceSavingsContribution.init(
    {
      goalId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          const v = this.getDataValue('amount');
          return v != null ? Number(v) : null;
        },
      },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      note: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: 'FinanceSavingsContribution',
      tableName: 'FinanceSavingsContributions',
      timestamps: true,
    }
  );
  return FinanceSavingsContribution;
};
