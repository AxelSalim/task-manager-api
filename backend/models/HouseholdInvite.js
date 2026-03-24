'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HouseholdInvite extends Model {
    static associate(models) {
      HouseholdInvite.belongsTo(models.Household, { foreignKey: 'householdId', as: 'household' });
    }
  }
  HouseholdInvite.init(
    {
      householdId: { type: DataTypes.INTEGER, allowNull: false },
      code: { type: DataTypes.STRING(16), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'HouseholdInvite',
      tableName: 'HouseholdInvites',
      timestamps: true,
    }
  );
  return HouseholdInvite;
};
