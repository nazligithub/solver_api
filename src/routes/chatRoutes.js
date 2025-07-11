const express = require('express');
const {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
  addFaceAnalysisToChat
} = require('../controllers/chatController');

const router = express.Router();

router.post('/conversations', createConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id/messages', sendMessage);
router.delete('/conversations/:id', deleteConversation);
router.post('/conversations/:id/add-face-analysis', addFaceAnalysisToChat);

module.exports = router;