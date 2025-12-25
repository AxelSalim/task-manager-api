'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tasks', 'subtasks', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: '[]',
      comment: 'JSON array of subtasks: [{id, title, completed}]'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tasks', 'subtasks');
  }
};

