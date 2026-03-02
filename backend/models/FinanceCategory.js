'use strict';

const { Model } = require('sequelize');

const TYPES = ['revenus', 'factures', 'depenses', 'epargnes', 'credits'];

module.exports = (sequelize, DataTypes) => {
  class FinanceCategory extends Model {
    static associate(models) {
      FinanceCategory.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      FinanceCategory.hasMany(models.FinanceTransaction, {
        foreignKey: 'categoryId',
        as: 'transactions',
      });
      FinanceCategory.hasMany(models.FinanceBudgetEntry, {
        foreignKey: 'categoryId',
        as: 'budgetEntries',
      });
    }
  }
  FinanceCategory.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [TYPES] },
      },
    },
    {
      sequelize,
      modelName: 'FinanceCategory',
      tableName: 'FinanceCategories',
      timestamps: true,
    }
  );
  return FinanceCategory;
};
