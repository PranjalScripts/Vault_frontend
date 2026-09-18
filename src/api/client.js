import { create, getAdapter } from "axios";
import { Platform } from "react-native";

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

API.interceptors.response.use(
  async (response) => {
    const method = response.config.method?.toLowerCase();

    const url = response.config.url || "";
    if (Platform.OS !== "web" && !response.config.__reminderSync && (/^\/todos(?:\/|$)/.test(url) || url.startsWith("/subjects/"))) {
      try {
        const { captureReminderData } = await import("@/notifications/reminders");
        await captureReminderData(response);
      } catch { console.warn("Local reminders could not be updated; they will retry when Vault opens."); }
    }
    if (Platform.OS !== "web" && method === "post" && url.startsWith("/trash/") && url.endsWith("/restore")) {
      try {
        const { refreshLocalReminders } = await import("@/notifications/reminders");
        await refreshLocalReminders();
      } catch { console.warn("Restored item reminders will refresh when Vault opens."); }
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export default API;
