import axios from 'axios';
import { ElMessage } from 'element-plus';
import { generateCacheKey } from '@/utils/helpers.js';
import memoryCache from '@/utils/cache.js';
import { RESPONSE_CODE } from '@/constants/index.js';

const pendingRequests = new Map();

const DEFAULT_CONFIG = {
  baseURL: '/api',
  timeout: 15000,
  retry: 2,
  retryDelay: 500,
  useCache: false,
  cacheTTL: 30 * 1000
};

const request = axios.create({
  baseURL: DEFAULT_CONFIG.baseURL,
  timeout: DEFAULT_CONFIG.timeout
});

const isNetworkError = (error) => {
  return !error.response && error.message && (
    error.message.includes('timeout') ||
    error.message.includes('Network Error') ||
    error.code === 'ECONNABORTED'
  );
};

const shouldRetry = (error, retryCount, maxRetries) => {
  if (retryCount >= maxRetries) return false;
  if (isNetworkError(error)) return true;
  if (error.response && error.response.status >= 500) return true;
  return false;
};

const getRetryConfig = (error) => {
  const originalRequest = error.config || {};
  originalRequest._retryCount = originalRequest._retryCount || 0;
  const maxRetries = originalRequest.retry ?? DEFAULT_CONFIG.retry;
  return { originalRequest, maxRetries, retryCount: originalRequest._retryCount };
};

const makeCancelTokenKey = (config) => {
  return generateCacheKey(config.method, {
    url: config.url,
    params: config.params,
    data: config.data
  });
};

const cancelPendingRequest = (config) => {
  const key = makeCancelTokenKey(config);
  if (pendingRequests.has(key)) {
    const cancel = pendingRequests.get(key);
    cancel('Request cancelled by duplicate');
    pendingRequests.delete(key);
  }
};

const saveCancelToken = (config) => {
  if (config.cancelDuplicate !== false && config.method?.toLowerCase() === 'get') {
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    const key = makeCancelTokenKey(config);
    cancelPendingRequest(config);
    pendingRequests.set(key, source.cancel);
  }
};

const removePendingRequest = (config) => {
  const key = makeCancelTokenKey(config);
  pendingRequests.delete(key);
};

request.interceptors.request.use(
  (config) => {
    saveCancelToken(config);
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    removePendingRequest(response.config);
    const res = response.data;
    const config = response.config;

    const useCache = config.useCache ?? DEFAULT_CONFIG.useCache;
    if (useCache && res.code === RESPONSE_CODE.SUCCESS) {
      const cacheKey = generateCacheKey(config.method, {
        url: config.url,
        params: config.params,
        data: config.data
      });
      memoryCache.set(cacheKey, res, config.cacheTTL ?? DEFAULT_CONFIG.cacheTTL);
    }

    if (res.code !== RESPONSE_CODE.SUCCESS) {
      if (config.silent !== true) {
        ElMessage.error(res.message || '请求失败');
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res;
  },
  async (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.config) {
      removePendingRequest(error.config);
    }

    const { originalRequest, maxRetries, retryCount } = getRetryConfig(error);

    if (shouldRetry(error, retryCount, maxRetries)) {
      originalRequest._retryCount = retryCount + 1;
      const delay = DEFAULT_CONFIG.retryDelay * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return request(originalRequest);
    }

    if (error.config?.silent !== true) {
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        ElMessage.error('请求超时，请稍后重试');
      } else if (isNetworkError(error)) {
        ElMessage.error('网络连接异常，请检查网络');
      } else if (error.response) {
        const { status, data } = error.response;
        const msg = data?.message || (status === 500 ? '服务器内部错误' : `请求失败 (${status})`);
        ElMessage.error(msg);
      } else {
        ElMessage.error(error.message || '网络错误');
      }
    }

    return Promise.reject(error);
  }
);

request.get = ((originalGet) => {
  return async function (url, config = {}) {
    const useCache = config.useCache ?? DEFAULT_CONFIG.useCache;
    if (useCache) {
      const cacheKey = generateCacheKey('get', {
        url,
        params: config.params,
        data: config.data
      });
      const cached = memoryCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    return originalGet.call(this, url, config);
  };
})(request.get);

request.cancelAll = () => {
  for (const cancel of pendingRequests.values()) {
    cancel('All requests cancelled');
  }
  pendingRequests.clear();
};

request.getPendingCount = () => pendingRequests.size;

export default request;
