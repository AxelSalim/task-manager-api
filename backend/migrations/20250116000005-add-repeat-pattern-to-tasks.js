'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tasks', 'repeatPattern', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON pattern de répétition: {type: "daily|weekly|monthly|yearly|custom", interval: 1, daysOfWeek: [1,2,3], endDate: "2025-12-31", count: 10}'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tasks', 'repeatPattern');
  }
};

