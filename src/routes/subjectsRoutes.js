const express = require('express');
const router = express.Router();
const subjectsController = require('../controllers/subjectsController');

// Get all subjects (for home screen grid)
router.get('/', subjectsController.getAllSubjects);

// Get subject statistics for a user
router.get('/stats', subjectsController.getSubjectStats);

// Get specific subject details
router.get('/:id', subjectsController.getSubjectById);

module.exports = router;