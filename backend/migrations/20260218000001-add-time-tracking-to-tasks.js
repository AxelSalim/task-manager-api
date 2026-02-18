'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tasks', 'estimatedMinutes', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Durée estimée en minutes (type Blitzit Est)',
    });
    await queryInterface.addColumn('Tasks', 'spentMinutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Temps passé en minutes (type Blitzit Done)',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Tasks', 'estimatedMinutes');
    await queryInterface.removeColumn('Tasks', 'spentMinutes');
  },
};
