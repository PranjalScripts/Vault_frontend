import { create, getAdapter } from "axios";

import { installResponseCache } from "./responseCache";

const API = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
console.log("API URL:", process.env.EXPO_PUBLIC_API_URL);

const responseCache = installResponseCache(API, getAdapter);
export const clearApiCache = () => responseCache.clear();
export const clearApiCacheFor = url => responseCache.clear(url);
export const forceRefresh = (url, config = {}) => {
  clearApiCacheFor(url);
  return API.get(url, { ...config, __forceRefresh: true });
};

export default API;
