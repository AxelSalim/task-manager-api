const express = require('express');
const authMiddleware = require('../middlewares/authmiddleware');
const householdController = require('../controllers/household.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/me', householdController.getMine);
router.post('/', householdController.create);
router.post('/invite', householdController.createInvite);
router.post('/join', householdController.join);

module.exports = router;
