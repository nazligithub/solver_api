const express = require('express');
const {
  getAllStyles,
  createStyle,
  updateStyle,
  deleteStyle,
  updateStylesOrder,
  getAllColors,
  createColor,
  updateColor,
  deleteColor,
  updateColorsOrder,
  createStyleWithAI,
  getProcessingHistory,
  getFaceAnalyses,
  deleteFaceAnalysis,
  getConversations,
  getConversationById,
  deleteConversation,
  getImageUploads,
  deleteImageUpload,
  getDashboardStats,
  getFirstApp
} = require('../../controllers/adminController');

const {
  getAllApps,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
  getAppStats
} = require('../../controllers/appController');

const router = express.Router();

// Hair Styles CRUD
router.get('/styles', getAllStyles);
router.post('/styles', createStyle);
router.put('/styles/order', updateStylesOrder);
router.put('/styles/:id', updateStyle);
router.delete('/styles/:id', deleteStyle);

// Special AI-powered style creation
router.post('/styles/create-with-ai', createStyleWithAI);

// Hair Colors CRUD
router.get('/colors', getAllColors);
router.post('/colors', createColor);
router.put('/colors/order', updateColorsOrder);
router.put('/colors/:id', updateColor);
router.delete('/colors/:id', deleteColor);

// Processing History
router.get('/processing-history', getProcessingHistory);

// Face Analyses
router.get('/face-analyses', getFaceAnalyses);
router.delete('/face-analyses/:id', deleteFaceAnalysis);

// Conversations
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);

// Image Uploads
router.get('/image-uploads', getImageUploads);
router.delete('/image-uploads/:id', deleteImageUpload);

// Dashboard Stats
router.get('/dashboard-stats', getDashboardStats);

// Apps Management
router.get('/apps', getAllApps);
router.get('/apps/stats', getAppStats);
router.get('/apps/1', getFirstApp); // Specific endpoint for app with id=1
router.get('/apps/:id', getAppById);
router.post('/apps', createApp);
router.put('/apps/:id', updateApp);
router.delete('/apps/:id', deleteApp);

module.exports = router;