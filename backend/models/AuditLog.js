'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  AuditLog.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },
      entityType: { type: DataTypes.STRING, allowNull: false },
      entityId: { type: DataTypes.INTEGER, allowNull: true },
      details: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'AuditLogs',
      timestamps: true,
      updatedAt: true,
    }
  );
  return AuditLog;
};
