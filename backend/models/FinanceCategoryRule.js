'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FinanceCategoryRule extends Model {
    static associate(models) {
      FinanceCategoryRule.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      FinanceCategoryRule.belongsTo(models.FinanceCategory, {
        foreignKey: 'categoryId',
        as: 'category',
      });
    }
  }
  FinanceCategoryRule.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      matchSubstring: { type: DataTypes.STRING, allowNull: false },
      categoryId: { type: DataTypes.INTEGER, allowNull: false },
      priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'FinanceCategoryRule',
      tableName: 'FinanceCategoryRules',
      timestamps: true,
    }
  );
  return FinanceCategoryRule;
};
