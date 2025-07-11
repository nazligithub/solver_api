const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

// Public routes (for mobile apps to check updates)
router.get('/check-update', appController.checkUpdate);
router.get('/latest-version', appController.getLatestVersion);

// Admin routes (protected in production)
router.get('/', appController.getAllApps);
router.get('/stats', appController.getAppStats);
router.get('/:id', appController.getAppById);
router.post('/', appController.createApp);
router.put('/:id', appController.updateApp);
router.delete('/:id', appController.deleteApp);

module.exports = router;