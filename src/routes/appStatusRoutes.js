const express = require('express');
const router = express.Router();
const appStatusController = require('../controllers/appStatusController');

// Public route - Get app status
router.get('/status', appStatusController.getAppStatus);

// Admin route - Update app status
router.put('/status', appStatusController.updateAppStatus);

module.exports = router;