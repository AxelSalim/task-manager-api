'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FinanceTransactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'revenus | factures | depenses | epargnes | credits',
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'FinanceCategories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      comment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('FinanceTransactions', ['userId']);
    await queryInterface.addIndex('FinanceTransactions', ['userId', 'date']);
    await queryInterface.addIndex('FinanceTransactions', ['userId', 'type']);
    await queryInterface.addIndex('FinanceTransactions', ['categoryId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FinanceTransactions');
  },
};
