import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import API, { clearApiCache } from "./client";

const TOKEN_KEY = "vault-auth-token";
let authListeners = [];

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
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
};

export const saveAuthToken = async (token) => {
  if (!token) {
    console.warn("saveAuthToken called without a token");
    return;
  }

  try {
    setAuthToken(token);

    if (Platform.OS === "web") {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }

    notifyAuthChange(true);
  } catch (error) {
    setAuthToken(null);
    throw error;
  }
};

export const getAuthToken = async () => {
  try {
    const token =
      Platform.OS === "web"
        ? window.localStorage.getItem(TOKEN_KEY)
        : await SecureStore.getItemAsync(TOKEN_KEY);

    setAuthToken(token);
    return token;
  } catch {
    setAuthToken(null);
    return null;
  }
};

export const logout = async () => {
  try {
    setAuthToken(null);
    clearApiCache();

    if (Platform.OS === "web") {
      window.localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
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
    if (error.response?.status === 401) {
      try {
        await logout();
      } catch (logoutError) {
        console.error("Automatic logout error:", logoutError);
      }
    }

    return Promise.reject(error);
  },
);
