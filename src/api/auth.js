import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import API, { clearApiCache } from "./client";

const TOKEN_KEY = "vault-auth-token";
const USER_KEY = "vault-auth-user";
let authListeners = [];
let authRevision = 0;
let currentToken = null;

export const subscribeToAuthChanges = (listener) => {
  authListeners.push(listener);

  return () => {
    authListeners = authListeners.filter((item) => item !== listener);
  };
};

const notifyAuthChange = (authenticated) => {
  authListeners.forEach((listener) => {
    try {
      listener(authenticated);
    } catch (error) {
      console.error("Auth listener error:", error);
    }
  });
};

export const setAuthToken = (token) => {
  authRevision += 1;
  currentToken = token || null;
  const nextAuthorization = token ? `Bearer ${token}` : undefined;
  if (API.defaults.headers.common.Authorization !== nextAuthorization) clearApiCache();
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
};

export const saveAuthToken = async (token, user = null) => {
  if (!token) {
    console.warn("saveAuthToken called without a token");
    return;
  }

  try {
    if (Platform.OS !== "web") {
      const { clearLocalReminders } = await import("@/notifications/reminders");
      await clearLocalReminders();
    }
    setAuthToken(token);

    if (Platform.OS === "web") {
      window.localStorage.setItem(TOKEN_KEY, token);
      if (user) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (user) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      }
    }

    notifyAuthChange(true);
  } catch (error) {
    setAuthToken(null);
    throw error;
  }
};

export const getAuthToken = async () => {
  const revision = authRevision;
  try {
    const token =
      Platform.OS === "web"
        ? window.localStorage.getItem(TOKEN_KEY)
        : await SecureStore.getItemAsync(TOKEN_KEY);

    if (revision !== authRevision) return currentToken;
    setAuthToken(token);
    return token;
  } catch {
    if (revision !== authRevision) return currentToken;
    setAuthToken(null);
    return null;
  }
};

export const getAuthUser = async () => {
  try {
    const userStr =
      Platform.OS === "web"
        ? window.localStorage.getItem(USER_KEY)
        : await SecureStore.getItemAsync(USER_KEY);

    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const logout = async () => {
  if (Platform.OS !== "web") {
    try {
      const { disablePush } = await import("@/notifications/push");
      await disablePush();
    } catch { console.warn("Phone alert deregistration could not reach the server."); }
  }
  if (Platform.OS !== "web") {
    try {
      const { clearLocalReminders } = await import("@/notifications/reminders");
      await clearLocalReminders();
    } catch {
      // An unavailable native notification API must never retain an expired session.
      console.warn("Signed out, but local notification cleanup failed. Previously scheduled reminders may remain until the app can clear them.");
    }
  }
  try {
    setAuthToken(null);
    clearApiCache();

    if (Platform.OS === "web") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }

    notifyAuthChange(false);
  } catch (error) {
    setAuthToken(null);
    clearApiCache();
    notifyAuthChange(false);
    throw error;
  }
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?.__reminderSync
      && error.config?.headers?.Authorization
      && error.config.headers.Authorization === API.defaults.headers.common.Authorization) {
      try {
        await logout();
      } catch (logoutError) {
        console.error("Automatic logout error:", logoutError);
      }
    }

    return Promise.reject(error);
  },
);
