import { create } from "axios";

const API_CACHE_TIME = 10 * 60 * 1000;
const apiCache = new Map();

const API = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.69:6307/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

const isCacheableGet = (url = "") => true;

const isPersistentCacheableGet = (url = "") =>
  ["/vault", "/passcodes"].some(
    (endpoint) => url === endpoint || url.startsWith(`${endpoint}/`),
  );

const createCacheKey = (config) => {
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  const authorization =
    config.headers?.Authorization ||
    API.defaults.headers.common.Authorization ||
    "";

  return `${authorization}:${url}:${params}`;
};

export const clearApiCache = () => {
  apiCache.clear();
};

export const clearApiCacheFor = (url) => {
  for (const key of apiCache.keys()) {
    if (key.includes(`:${url}:`) || key.includes(`:${url}`)) {
      apiCache.delete(key);
    }
  }
};

export const forceRefresh = (url, config = {}) => {
  clearApiCacheFor(url);
  return API.get(url, config);
};

API.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  if (method === "get") {
    const url = config.url || "";

    if (!isCacheableGet(url)) {
      return config;
    }

    const cacheKey = createCacheKey(config);
    const cached = apiCache.get(cacheKey);

    if (cached) {
      const cacheIsValid =
        isPersistentCacheableGet(url) ||
        Date.now() - cached.timestamp < API_CACHE_TIME;

      if (cacheIsValid) {
        config.adapter = async () => ({
          data: cached.data,
          status: cached.status || 200,
          statusText: cached.statusText || "OK",
          headers: cached.headers || {},
          config,
          request: null,
        });
        config.__fromCache = true;
        return config;
      }

      apiCache.delete(cacheKey);
    }
  }

  if (["post", "put", "patch", "delete"].includes(method)) {
    clearApiCache();
  }

  return config;
});

API.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();

    if (
      method === "get" &&
      !response.config.__fromCache &&
      isCacheableGet(response.config.url || "")
    ) {
      apiCache.set(createCacheKey(response.config), {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        timestamp: Date.now(),
      });
    }

    if (["post", "put", "patch", "delete"].includes(method)) {
      clearApiCache();
    }

    return response;
  },
  (error) => Promise.reject(error),
);

export default API;
