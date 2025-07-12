// Simple in-memory request tracker to detect duplicate processing
const activeRequests = new Map();

const requestTracker = {
  // Check if a request is already being processed
  isProcessing(requestId) {
    return activeRequests.has(requestId);
  },
  
  // Mark a request as being processed
  startProcessing(requestId) {
    if (this.isProcessing(requestId)) {
      console.log(`⚠️  Duplicate request detected: ${requestId}`);
      return false;
    }
    activeRequests.set(requestId, Date.now());
    return true;
  },
  
  // Mark a request as completed
  endProcessing(requestId) {
    activeRequests.delete(requestId);
  },
  
  // Clean up old requests (older than 5 minutes)
  cleanup() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    for (const [id, timestamp] of activeRequests) {
      if (timestamp < fiveMinutesAgo) {
        activeRequests.delete(id);
      }
    }
  }
};

// Run cleanup every minute
setInterval(() => requestTracker.cleanup(), 60000);

module.exports = requestTracker;