import config from '../config/index.js';

class CacheManager {
  constructor(ttl = config.cache.ttl, maxSize = config.cache.maxSize) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  _makeKey(namespace, key) {
    return `${namespace}:${key}`;
  }

  get(namespace, key) {
    const fullKey = this._makeKey(namespace, key);
    const entry = this.cache.get(fullKey);
    if (!entry) return null;
    if (Date.now() > entry.expireAt) {
      this.cache.delete(fullKey);
      return null;
    }
    return entry.value;
  }

  set(namespace, key, value, ttl = this.ttl) {
    const fullKey = this._makeKey(namespace, key);
    if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(fullKey, {
      value,
      expireAt: Date.now() + ttl
    });
    return value;
  }

  delete(namespace, key) {
    const fullKey = this._makeKey(namespace, key);
    return this.cache.delete(fullKey);
  }

  invalidate(namespace) {
    const prefix = `${namespace}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  wrap(namespace, key, fn, ttl) {
    const cached = this.get(namespace, key);
    if (cached !== null) return cached;
    const result = fn();
    const resolved = result instanceof Promise ? result : Promise.resolve(result);
    return resolved.then((val) => {
      this.set(namespace, key, val, ttl);
      return val;
    });
  }

  get size() {
    return this.cache.size;
  }
}

export const cache = new CacheManager();
export default cache;
