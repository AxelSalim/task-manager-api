'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PasswordReset extends Model {
    static associate(models) {
      // Pas d'association directe avec User pour éviter les dépendances circulaires
    }

    // Méthode pour vérifier si le code OTP est expiré
    isExpired() {
      return new Date() > this.expires_at;
    }

    // Méthode pour marquer le code comme utilisé
    markAsUsed() {
      this.used = true;
      return this.save();
    }

    // Méthode statique pour nettoyer les codes expirés
    static async cleanupExpiredCodes() {
      return await this.destroy({
        where: {
          expires_at: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      });
    }
  }

  PasswordReset.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    otp_code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 6] // Code OTP de 6 chiffres
      }
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'PasswordResets',
    timestamps: true,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  return PasswordReset;
};
