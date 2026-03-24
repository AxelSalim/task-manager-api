'use strict';

const { Model } = require('sequelize');

const ROLES = ['owner', 'member'];

module.exports = (sequelize, DataTypes) => {
  class HouseholdMember extends Model {
    static associate(models) {
      HouseholdMember.belongsTo(models.Household, { foreignKey: 'householdId', as: 'household' });
      HouseholdMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  HouseholdMember.init(
    {
      householdId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member',
        validate: { isIn: [ROLES] },
      },
    },
    {
      sequelize,
      modelName: 'HouseholdMember',
      tableName: 'HouseholdMembers',
      timestamps: true,
    }
  );
  return HouseholdMember;
};
