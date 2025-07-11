const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { upload } = require('../services/uploadService');

// Homework solving endpoint
router.post('/solve', upload.single('image'), homeworkController.solveHomework);

// Get user's homework history
router.get('/history', homeworkController.getHistory);

// Get specific submission details
router.get('/submission/:id', homeworkController.getSubmission);

// Get user statistics
router.get('/stats', homeworkController.getStats);

module.exports = router;