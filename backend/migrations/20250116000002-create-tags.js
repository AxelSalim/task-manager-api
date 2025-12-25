'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#3b82f6' // Bleu par défaut
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Ajouter un index sur userId pour améliorer les performances
    await queryInterface.addIndex('Tags', ['userId']);
    
    // Ajouter un index unique sur userId + name pour éviter les doublons
    await queryInterface.addIndex('Tags', ['userId', 'name'], {
      unique: true,
      name: 'unique_user_tag'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tags');
  }
};



