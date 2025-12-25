'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tasks', 'reminderDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date et heure du rappel pour la tâche'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tasks', 'reminderDate');
  }
};

