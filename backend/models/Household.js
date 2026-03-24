'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Household extends Model {
    static associate(models) {
      Household.belongsTo(models.User, { foreignKey: 'ownerUserId', as: 'owner' });
      Household.hasMany(models.HouseholdMember, { foreignKey: 'householdId', as: 'members' });
      Household.hasMany(models.HouseholdInvite, { foreignKey: 'householdId', as: 'invites' });
    }
  }
  Household.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      ownerUserId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Household',
      tableName: 'Households',
      timestamps: true,
    }
  );
  return Household;
};
