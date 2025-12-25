'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate(models) {
      Tag.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Tag.belongsToMany(models.Task, {
        through: 'TaskTags',
        foreignKey: 'tagId',
        otherKey: 'taskId',
        as: 'tasks'
      });
    }
  }
  Tag.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#3b82f6',
      validate: {
        is: /^#[0-9A-F]{6}$/i // Format hexadécimal
      }
    }
  }, {
    sequelize,
    modelName: "Tag",
    timestamps: true,
  });
  return Tag;
};



