'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Task, { foreignKey: "userId", as: "tasks" });
      User.hasMany(models.Tag, { foreignKey: "userId", as: "tags" });
      User.hasMany(models.FinanceCategory, { foreignKey: "userId", as: "financeCategories" });
      User.hasMany(models.FinanceTransaction, { foreignKey: "userId", as: "financeTransactions" });
      User.hasMany(models.FinanceBudgetEntry, { foreignKey: "userId", as: "financeBudgetEntries" });
      User.hasMany(models.Habit, { foreignKey: "userId", as: "habits" });
      User.hasMany(models.HabitCompletion, { foreignKey: "userId", as: "habitCompletions" });
      User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
      User.hasMany(models.FinanceSubscription, { foreignKey: 'userId', as: 'financeSubscriptions' });
      User.hasMany(models.FinanceSavingsGoal, { foreignKey: 'userId', as: 'financeSavingsGoals' });
      User.hasMany(models.FinanceCategoryRule, { foreignKey: 'userId', as: 'financeCategoryRules' });
      User.hasMany(models.Household, { foreignKey: 'ownerUserId', as: 'ownedHouseholds' });
      User.hasOne(models.HouseholdMember, { foreignKey: 'userId', as: 'householdMembership' });
    }
  }
  User.init({
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, allowNull: true },
    pin_hash: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: "User",
    timestamps: true
  });
  return User;
}