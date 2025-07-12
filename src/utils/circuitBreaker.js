// Circuit breaker to prevent infinite loops
class CircuitBreaker {
  constructor(threshold = 10, resetTime = 60000) {
    this.failures = new Map();
    this.threshold = threshold;
    this.resetTime = resetTime;
    this.states = new Map(); // 'closed', 'open', 'half-open'
  }

  async execute(key, fn) {
    const state = this.states.get(key) || 'closed';
    
    if (state === 'open') {
      const lastFailure = this.failures.get(key);
      if (Date.now() - lastFailure.timestamp > this.resetTime) {
        console.log(`⚡ Circuit breaker: ${key} moving to half-open`);
        this.states.set(key, 'half-open');
      } else {
        throw new Error(`Circuit breaker is open for ${key}`);
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset failures
      if (state === 'half-open') {
        console.log(`✅ Circuit breaker: ${key} closing`);
        this.states.set(key, 'closed');
        this.failures.delete(key);
      }
      
      return result;
    } catch (error) {
      // Track failure
      const failureData = this.failures.get(key) || { count: 0, timestamp: Date.now() };
      failureData.count++;
      failureData.timestamp = Date.now();
      this.failures.set(key, failureData);
      
      console.log(`⚠️  Circuit breaker: ${key} failure ${failureData.count}/${this.threshold}`);
      
      // Open circuit if threshold reached
      if (failureData.count >= this.threshold) {
        console.log(`🔴 Circuit breaker: ${key} opening (too many failures)`);
        this.states.set(key, 'open');
      }
      
      throw error;
    }
  }
  
  reset(key) {
    this.states.delete(key);
    this.failures.delete(key);
  }
  
  getState(key) {
    return {
      state: this.states.get(key) || 'closed',
      failures: this.failures.get(key)?.count || 0
    };
  }
}

module.exports = new CircuitBreaker();