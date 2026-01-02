'use strict';

const { Model } = require('sequelize');

const TYPES = ['revenus', 'factures', 'depenses', 'epargnes', 'credits'];

module.exports = (sequelize, DataTypes) => {
  class FinanceTransaction extends Model {
    static associate(models) {
      FinanceTransaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      FinanceTransaction.belongsTo(models.FinanceCategory, {
        foreignKey: 'categoryId',
        as: 'category',
      });
    }
  }
  FinanceTransaction.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [TYPES] },
      },
      categoryId: { type: DataTypes.INTEGER, allowNull: true },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          const v = this.getDataValue('amount');
          return v != null ? Number(v) : null;
        },
      },
      comment: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: 'FinanceTransaction',
      tableName: 'FinanceTransactions',
      timestamps: true,
    }
  );
  return FinanceTransaction;
};
