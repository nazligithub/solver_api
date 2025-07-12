const { errorResponse } = require('../utils/response');

/**
 * Middleware to extract and validate user ID from headers
 * Follows the pattern used in chatController and hairController
 */
const extractUserId = (req, res, next) => {
  // Check multiple header variations for user ID
  const userId = req.headers['x-user-id'] || 
                 req.headers['user-id'] || 
                 req.headers['userid'] ||
                 req.ip;
  
  if (!userId) {
    return errorResponse(res, 'User ID is required in headers', 401);
  }
  
  // Attach userId to request object for easy access
  req.userId = userId;
  next();
};

/**
 * Optional middleware that allows anonymous access with IP fallback
 */
const extractUserIdOptional = (req, res, next) => {
  // Check multiple header variations for user ID, fallback to IP
  const userId = req.headers['x-user-id'] || 
                 req.headers['user-id'] || 
                 req.headers['userid'] ||
                 req.ip;
  
  // Always attach userId (even if it's just the IP)
  req.userId = userId;
  next();
};

module.exports = {
  extractUserId,
  extractUserIdOptional
};