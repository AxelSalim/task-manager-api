'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TaskTags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tagId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Ajouter un index composite unique pour éviter les doublons
    await queryInterface.addIndex('TaskTags', ['taskId', 'tagId'], {
      unique: true,
      name: 'unique_task_tag'
    });
    
    // Ajouter des index pour améliorer les performances
    await queryInterface.addIndex('TaskTags', ['taskId']);
    await queryInterface.addIndex('TaskTags', ['tagId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TaskTags');
  }
};



