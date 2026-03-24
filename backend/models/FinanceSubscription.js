'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FinanceSubscription extends Model {
    static associate(models) {
      FinanceSubscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      FinanceSubscription.belongsTo(models.FinanceCategory, {
        foreignKey: 'categoryId',
        as: 'category',
      });
    }
  }
  FinanceSubscription.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          const v = this.getDataValue('amount');
          return v != null ? Number(v) : null;
        },
      },
      billingDay: { type: DataTypes.INTEGER, allowNull: false },
      reminderDaysBefore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      categoryId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'FinanceSubscription',
      tableName: 'FinanceSubscriptions',
      timestamps: true,
    }
  );
  return FinanceSubscription;
};
