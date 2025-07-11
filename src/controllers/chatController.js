const ChatService = require('../services/chatService');
const { BaseResponse, ApiError, asyncHandler } = require('../utils/response');
const supabase = require('../config/supabase');

const chatService = new ChatService();

const createConversation = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const { message, faceAnalysisId } = req.body;
  
  // Create new conversation
  const conversation = await chatService.createConversation(userId, message);
  
  // Add face analysis context if provided
  if (faceAnalysisId) {
    // Verify face analysis belongs to user
    const { data: faceAnalysis } = await supabase
      .from('face_analyses')
      .select('id')
      .eq('id', faceAnalysisId)
      .eq('user_id', userId)
      .single();
    
    if (faceAnalysis) {
      await chatService.addFaceAnalysisContext(conversation.id, faceAnalysisId);
    }
  }
  
  // Send first message if provided
  let response = null;
  if (message) {
    response = await chatService.sendMessage(conversation.id, userId, message, !!faceAnalysisId);
  }
  
  res.json(BaseResponse.success('Conversation created successfully', {
    conversation,
    response
  }));
});

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  
  const conversations = await chatService.getConversations(userId);
  
  res.json(BaseResponse.success('Conversations fetched successfully', conversations));
});

const getConversation = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const { id } = req.params;
  
  const conversation = await chatService.getConversationWithMessages(id, userId);
  
  res.json(BaseResponse.success('Conversation fetched successfully', conversation));
});

const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const { id } = req.params;
  const { message } = req.body;
  
  if (!message) {
    throw new ApiError('Message is required', 400);
  }
  
  const response = await chatService.sendMessage(id, userId, message);
  
  res.json(BaseResponse.success('Message sent successfully', response));
});

const deleteConversation = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const { id } = req.params;
  
  await chatService.deleteConversation(id, userId);
  
  res.json(BaseResponse.success('Conversation deleted successfully'));
});

const addFaceAnalysisToChat = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const { id } = req.params;
  const { faceAnalysisId } = req.body;
  
  if (!faceAnalysisId) {
    throw new ApiError('Face analysis ID is required', 400);
  }
  
  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  
  if (!conversation) {
    throw new ApiError('Conversation not found', 404);
  }
  
  // Verify face analysis belongs to user
  const { data: faceAnalysis } = await supabase
    .from('face_analyses')
    .select('id')
    .eq('id', faceAnalysisId)
    .eq('user_id', userId)
    .single();
  
  if (!faceAnalysis) {
    throw new ApiError('Face analysis not found', 404);
  }
  
  await chatService.addFaceAnalysisContext(id, faceAnalysisId);
  
  res.json(BaseResponse.success('Face analysis added to conversation'));
});

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
  addFaceAnalysisToChat
};