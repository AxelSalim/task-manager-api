'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PasswordResets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      otp_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Ajouter un index sur l'email pour améliorer les performances
    await queryInterface.addIndex('PasswordResets', ['email']);
    
    // Ajouter un index sur expires_at pour le nettoyage automatique
    await queryInterface.addIndex('PasswordResets', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PasswordResets');
  }
};
