'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FinanceBudgetEntry extends Model {
    static associate(models) {
      FinanceBudgetEntry.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      FinanceBudgetEntry.belongsTo(models.FinanceCategory, {
        foreignKey: 'categoryId',
        as: 'category',
      });
    }
  }
  FinanceBudgetEntry.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      categoryId: { type: DataTypes.INTEGER, allowNull: false },
      year: { type: DataTypes.INTEGER, allowNull: false },
      month: { type: DataTypes.INTEGER, allowNull: false },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
          const v = this.getDataValue('amount');
          return v != null ? Number(v) : 0;
        },
      },
    },
    {
      sequelize,
      modelName: 'FinanceBudgetEntry',
      tableName: 'FinanceBudgetEntries',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['userId', 'categoryId', 'year', 'month'] },
      ],
    }
  );
  return FinanceBudgetEntry;
};
