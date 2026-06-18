class MemoryCache {
  constructor(ttl = 5 * 60 * 1000, maxSize = 100) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expireAt) {
      this.cache.delete(key);
      return null;
    }
    entry.hits = (entry.hits || 0) + 1;
    return entry.value;
  }

  set(key, value, ttl = this.ttl) {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      let oldestKey = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.cache.entries()) {
        if (v.expireAt < oldestTime) {
          oldestTime = v.expireAt;
          oldestKey = k;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value,
      expireAt: Date.now() + ttl,
      createdAt: Date.now(),
      hits: 0
    });
    return value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) this.cache.delete(key);
    }
  }

  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }

  async wrap(key, fn, ttl) {
    const cached = this.get(key);
    if (cached !== null) return cached;
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }
}

export const memoryCache = new MemoryCache();
export default memoryCache;
