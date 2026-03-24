'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Households', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      ownerUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('Households', ['ownerUserId']);

    await queryInterface.createTable('HouseholdMembers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      householdId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Households', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: { type: Sequelize.STRING, allowNull: false, defaultValue: 'member' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('HouseholdMembers', ['householdId']);
    await queryInterface.addIndex('HouseholdMembers', ['userId'], { unique: true });

    await queryInterface.createTable('HouseholdInvites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      householdId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Households', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      code: { type: Sequelize.STRING(16), allowNull: false, unique: true },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('HouseholdInvites', ['householdId']);

    await queryInterface.createTable('FinanceSubscriptions', {
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
      name: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      billingDay: { type: Sequelize.INTEGER, allowNull: false },
      reminderDaysBefore: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'FinanceCategories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('FinanceSubscriptions', ['userId']);

    await queryInterface.createTable('FinanceSavingsGoals', {
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
      name: { type: Sequelize.STRING, allowNull: false },
      targetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('FinanceSavingsGoals', ['userId']);

    await queryInterface.createTable('FinanceSavingsContributions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      goalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'FinanceSavingsGoals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      note: { type: Sequelize.STRING, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('FinanceSavingsContributions', ['goalId']);

    await queryInterface.createTable('FinanceCategoryRules', {
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
      matchSubstring: { type: Sequelize.STRING, allowNull: false },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'FinanceCategories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      priority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('FinanceCategoryRules', ['userId']);

    await queryInterface.createTable('AuditLogs', {
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
      action: { type: Sequelize.STRING, allowNull: false },
      entityType: { type: Sequelize.STRING, allowNull: false },
      entityId: { type: Sequelize.INTEGER, allowNull: true },
      details: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex('AuditLogs', ['userId']);
    await queryInterface.addIndex('AuditLogs', ['createdAt']);

    await queryInterface.addColumn('Tasks', 'householdId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Households', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('Tasks', ['householdId']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Tasks', 'householdId');
    await queryInterface.dropTable('AuditLogs');
    await queryInterface.dropTable('FinanceCategoryRules');
    await queryInterface.dropTable('FinanceSavingsContributions');
    await queryInterface.dropTable('FinanceSavingsGoals');
    await queryInterface.dropTable('FinanceSubscriptions');
    await queryInterface.dropTable('HouseholdInvites');
    await queryInterface.dropTable('HouseholdMembers');
    await queryInterface.dropTable('Households');
  },
};
