const express = require('express');
const router = express.Router();
const multer = require('multer');
const homeworkController = require('../controllers/homeworkController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Homework solving endpoint
router.post('/solve', upload.single('image'), homeworkController.solveHomework);

// Get user's homework history
router.get('/history', homeworkController.getHistory);

// Get specific submission details
router.get('/submission/:id', homeworkController.getSubmission);

// Get user statistics
router.get('/stats', homeworkController.getStats);

module.exports = router;