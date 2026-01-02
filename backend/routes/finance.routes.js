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

module.exports = router;
