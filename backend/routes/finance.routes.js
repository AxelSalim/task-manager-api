const express = require('express');
const authMiddleware = require('../middlewares/authmiddleware');
const financeController = require('../controllers/finance.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/categories', financeController.getCategories);
router.post('/categories', financeController.createCategory);
router.put('/categories/:id', financeController.updateCategory);
router.delete('/categories/:id', financeController.deleteCategory);

router.get('/transactions', financeController.getTransactions);
router.post('/transactions', financeController.createTransaction);
router.put('/transactions/:id', financeController.updateTransaction);
router.delete('/transactions/:id', financeController.deleteTransaction);

router.get('/budget', financeController.getBudget);
router.put('/budget', financeController.putBudget);

router.get('/dashboard', financeController.getDashboard);
router.get('/dashboard/evolution', financeController.getDashboardEvolution);
router.get('/dashboard/year', financeController.getDashboardYear);

router.get('/report/monthly-summary', financeController.getMonthlyReportSummary);

router.get('/subscriptions', financeController.getSubscriptions);
router.get('/subscriptions/alerts', financeController.getSubscriptionAlerts);
router.post('/subscriptions', financeController.createSubscription);
router.put('/subscriptions/:id', financeController.updateSubscription);
router.delete('/subscriptions/:id', financeController.deleteSubscription);

router.get('/savings-goals', financeController.getSavingsGoals);
router.post('/savings-goals', financeController.createSavingsGoal);
router.put('/savings-goals/:id', financeController.updateSavingsGoal);
router.delete('/savings-goals/:id', financeController.deleteSavingsGoal);
router.get('/savings-goals/:goalId/contributions', financeController.getSavingsContributions);
router.post('/savings-goals/:goalId/contributions', financeController.addSavingsContribution);
router.delete('/savings-goals/:goalId/contributions/:id', financeController.deleteSavingsContribution);

router.get('/category-rules', financeController.getCategoryRules);
router.post('/category-rules', financeController.createCategoryRule);
router.put('/category-rules/:id', financeController.updateCategoryRule);
router.delete('/category-rules/:id', financeController.deleteCategoryRule);

module.exports = router;
