const ChatService = require('../services/chatService');
const { BaseResponse, ApiError, asyncHandler } = require('../utils/response');

const chatService = new ChatService();

const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const { message } = req.body;
  
  if (!message) {
    throw new ApiError('Message is required', 400);
  }

  const response = await chatService.sendMessage(userId, message);
  
  res.json(BaseResponse.success('Message sent successfully', response));
});

module.exports = {
  sendMessage
};