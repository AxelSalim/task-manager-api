'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Ajouter la colonne description
    await queryInterface.addColumn('Tasks', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Ajouter la colonne priority
    await queryInterface.addColumn('Tasks', 'priority', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'normal'
    });

    // Ajouter la colonne dueDate
    await queryInterface.addColumn('Tasks', 'dueDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Supprimer les colonnes dans l'ordre inverse
    await queryInterface.removeColumn('Tasks', 'dueDate');
    await queryInterface.removeColumn('Tasks', 'priority');
    await queryInterface.removeColumn('Tasks', 'description');
  }
};
