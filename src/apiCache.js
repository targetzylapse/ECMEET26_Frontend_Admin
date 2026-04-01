/**
 * Simple key-value cache for API responses.
 */
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // Default 5 minutes
  }

  /**
   * Get data from cache if it exists and hasn't expired.
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data into cache with a timestamp.
   * @param {string} key 
   * @param {any} data 
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate all keys starting with a specific prefix.
   * @param {string} prefix 
   */
  invalidate(prefix) {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Create a cache key from an endpoint and params.
   * @param {string} endpoint 
   * @param {object} params 
   * @returns {string}
   */
  createKey(endpoint, params = {}) {
    if (!params || Object.keys(params).length === 0) return endpoint;
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
    return `${endpoint}?${JSON.stringify(sortedParams)}`;
  }
}

export const apiCache = new ApiCache();
