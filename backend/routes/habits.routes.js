const express = require('express');
const authMiddleware = require('../middlewares/authmiddleware');
const habitsController = require('../controllers/habits.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', habitsController.getHabits);
router.post('/', habitsController.createHabit);
router.put('/:id', habitsController.updateHabit);
router.delete('/:id', habitsController.deleteHabit);

router.get('/completions', habitsController.getCompletions);
router.post('/completions', habitsController.setCompletion);

module.exports = router;
