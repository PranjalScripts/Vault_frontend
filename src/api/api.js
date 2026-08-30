
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "vault-auth-token";

const API = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.57:6307/api/",
  headers: {
    "Content-Type": "application/json",
  },
});



const API_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

const apiCache = new Map();

/*
 * =========================================================
 * CREATE CACHE KEY
 * =========================================================
 */

const createCacheKey = (config) => {
  const url = config.url || "";

  const params = config.params
    ? JSON.stringify(config.params)
    : "";

  const authorization =
    config.headers?.Authorization ||
    API.defaults.headers.common.Authorization ||
    "";

  return `${authorization}:${url}:${params}`;
};

/*
 * =========================================================
 * CLEAR ALL API CACHE
 * =========================================================
 */

export const clearApiCache = () => {
  console.log("🗑️ Clearing ALL API cache");

  apiCache.clear();
};

/*
 * =========================================================
 * CLEAR CACHE FOR SPECIFIC URL
 * =========================================================
 */

export const clearApiCacheFor = (url) => {
  console.log(`🗑️ Clearing cache for: ${url}`);

  for (const key of apiCache.keys()) {
    /*
     * Cache key contains the URL.
     */
    if (key.includes(`:${url}:`) || key.includes(`:${url}`)) {
      apiCache.delete(key);
    }
  }
};

/*
 * =========================================================
 * FORCE REFRESH
 * =========================================================
 *
 * Clears the cache for a specific GET endpoint and
 * immediately makes a fresh API request.
 */

export const forceRefresh = async (
  url,
  config = {}
) => {
  clearApiCacheFor(url);

  return API.get(url, config);
};

/*
 * =========================================================
 * AUTH STATE LISTENERS
 * =========================================================
 */

let authListeners = [];

export const subscribeToAuthChanges = (listener) => {
  authListeners.push(listener);

  return () => {
    authListeners = authListeners.filter(
      (item) => item !== listener
    );
  };
};

const notifyAuthChange = (authenticated) => {
  authListeners.forEach((listener) => {
    try {
      listener(authenticated);
    } catch (error) {
      console.error(
        "Auth listener error:",
        error
      );
    }
  });
};

/*
 * =========================================================
 * SET AUTH TOKEN
 * =========================================================
 */

export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common.Authorization =
      `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
};

/*
 * =========================================================
 * SAVE AUTH TOKEN
 * =========================================================
 */

export const saveAuthToken = async (token) => {
  if (!token) {
    console.warn(
      "⚠️ saveAuthToken called without a token"
    );
    return;
  }

  try {
    /*
     * Set Axios token immediately.
     */
    setAuthToken(token);

    /*
     * Save token permanently.
     */
    if (Platform.OS === "web") {
      window.localStorage.setItem(
        TOKEN_KEY,
        token
      );
    } else {
      await SecureStore.setItemAsync(
        TOKEN_KEY,
        token
      );
    }

    console.log(
      "✅ Authentication token saved"
    );

    /*
     * Notify RootLayout.
     */
    notifyAuthChange(true);
  } catch (error) {
    console.error(
      "❌ Failed to save auth token:",
      error
    );

    /*
     * Do not leave Axios authenticated
     * if saving the token failed.
     */
    setAuthToken(null);

    throw error;
  }
};

/*
 * =========================================================
 * GET AUTH TOKEN
 * =========================================================
 */

export const getAuthToken = async () => {
  let token = null;

  try {
    if (Platform.OS === "web") {
      token =
        window.localStorage.getItem(
          TOKEN_KEY
        );
    } else {
      token =
        await SecureStore.getItemAsync(
          TOKEN_KEY
        );
    }

    if (token) {
      setAuthToken(token);
    } else {
      setAuthToken(null);
    }

    return token;
  } catch (error) {
    console.error(
      "❌ Failed to get auth token:",
      error
    );

    setAuthToken(null);

    return null;
  }
};

/*
 * =========================================================
 * LOGOUT
 * =========================================================
 */

export const logout = async () => {
  try {
    console.log("🚪 Logging out...");

    /*
     * Remove token from Axios immediately.
     */
    setAuthToken(null);

    /*
     * IMPORTANT:
     * Remove cached data when logging out.
     *
     * This prevents old user's data from
     * remaining in memory.
     */
    clearApiCache();

    /*
     * Remove token from storage.
     */
    if (Platform.OS === "web") {
      window.localStorage.removeItem(
        TOKEN_KEY
      );
    } else {
      await SecureStore.deleteItemAsync(
        TOKEN_KEY
      );
    }

    console.log(
      "✅ Authentication token removed"
    );

    /*
     * Tell RootLayout.
     */
    notifyAuthChange(false);
  } catch (error) {
    console.error(
      "❌ Logout error:",
      error
    );

    /*
     * Always remove Axios authentication.
     */
    setAuthToken(null);

    /*
     * Always clear cached data.
     */
    clearApiCache();

    /*
     * Always tell the application that
     * the user is logged out.
     */
    notifyAuthChange(false);

    throw error;
  }
};

/*
 * =========================================================
 * GOOGLE LOGIN
 * =========================================================
 */

export const googleLogin = (idToken) => {
  return API.post("/auth/google", {
    idToken,
  });
};

/*
 * =========================================================
 * SUBJECTS
 * =========================================================
 */

/*
 * Normal GET.
 *
 * Automatically cached for 10 minutes.
 */
export const getSubjects = () => {
  return API.get(
    "/subjects/getAll-subjects"
  );
};

/*
 * Force fresh subjects request.
 *
 * Useful for your Refresh button.
 */
export const refreshSubjects = () => {
  return forceRefresh(
    "/subjects/getAll-subjects"
  );
};

export const getSubject = (id) => {
  return API.get(
    `/subjects/${id}`
  );
};

export const createSubject = (
  subjectName
) => {
  return API.post(
    "/subjects/create-subject",
    {
      subjectName,
    }
  );
};

export const addTopic = (
  subjectId,
  topicData
) => {
  return API.post(
    `/subjects/${subjectId}/topics`,
    topicData
  );
};

export const deleteSubject = (
  subjectId
) => {
  return API.delete(
    `/subjects/${subjectId}`
  );
};

export const updateTopic = (
  subjectId,
  topicId,
  topicData
) => {
  return API.put(
    `/subjects/${subjectId}/topics/${topicId}`,
    topicData
  );
};

export const deleteTopic = (
  subjectId,
  topicId
) => {
  return API.delete(
    `/subjects/${subjectId}/topics/${topicId}`
  );
};

/*
 * =========================================================
 * TODOS
 * =========================================================
 */

/**
 * @typedef {Object} GetTodosParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {"completed"|"pending"|"all"} [status]
 */

/**
 * @param {GetTodosParams} params
 */
export const getTodos = ({
  page = 1,
  limit = 20,
  status,
} = {}) => {
  return API.get("/todos", {
    params: {
      page,
      limit,
      ...(status && status !== "all" ? { status } : {}),
    },
  });
};
export const createTodo = (todoData) => {
  return API.post("/todos", todoData);
};

export const updateTodo = (todoId, todoData) => {
  return API.put(`/todos/${todoId}`, todoData);
};

export const deleteTodo = (todoId) => {
  return API.delete(`/todos/${todoId}`);
};

/*
 * =========================================================
 * PASSCODES
 * =========================================================
 */
export const getPasscodes = ({
  page = 1,
  limit = 20,
  search = "",
  sort = "newest",
} = {}) => {
  return API.get("/passcodes", {
    params: {
      page,
      limit,
      ...(search.trim() && {
        search: search.trim(),
      }),
      sort,
    },
  });
};
export const createPasscode = (
  passcodeData
) => {
  return API.post(
    "/passcodes",
    passcodeData
  );
};

export const updatePasscode = (
  id,
  data
) => {
  return API.put(
    `/passcodes/${id}`,
    data
  );
};

export const deletePasscode = (
  passcodeId
) => {
  return API.delete(
    `/passcodes/${passcodeId}`
  );
};

/*
 * =========================================================
 * AXIOS REQUEST INTERCEPTOR
 * =========================================================
 *
 * Before every request:
 *
 * GET
 *   → Check cache
 *
 * POST / PUT / PATCH / DELETE
 *   → Clear cache
 */

API.interceptors.request.use(
  async (config) => {
    const method =
      config.method?.toLowerCase();

    /*
     * =====================================================
     * GET REQUEST
     * =====================================================
     */

    if (method === "get") {
      const cacheKey =
        createCacheKey(config);

      const cached =
        apiCache.get(cacheKey);

      if (cached) {
        const age =
          Date.now() -
          cached.timestamp;

        /*
         * Cache is still valid.
         */
        if (
          age < API_CACHE_TIME
        ) {
          console.log(
            `📦 CACHE HIT: ${config.url}`
          );

          /*
           * Store cached response
           * directly on config.
           *
           * The adapter will return this
           * without making a network request.
           */
          config.adapter = async () => {
            return {
              data: cached.data,
              status: cached.status || 200,
              statusText:
                cached.statusText || "OK",
              headers:
                cached.headers || {},
              config,
              request: null,
            };
          };

          /*
           * Mark this request as cached.
           */
          config.__fromCache = true;
        } else {
          /*
           * Cache expired.
           */
          console.log(
            `⏰ CACHE EXPIRED: ${config.url}`
          );

          apiCache.delete(cacheKey);
        }
      } else {
        console.log(
          `🌐 CACHE MISS: ${config.url}`
        );
      }
    }

    /*
     * =====================================================
     * DATABASE-MODIFYING REQUEST
     * =====================================================
     *
     * Any POST / PUT / PATCH / DELETE means
     * server-side data may have changed.
     *
     * Clear all GET cache.
     */

    if (
      method === "post" ||
      method === "put" ||
      method === "patch" ||
      method === "delete"
    ) {
      console.log(
        `✏️ DATA CHANGE REQUEST: ${method.toUpperCase()} ${config.url}`
      );

      clearApiCache();
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/*
 * =========================================================
 * AXIOS RESPONSE INTERCEPTOR
 * =========================================================
 */

API.interceptors.response.use(
  (response) => {
    const method =
      response.config.method?.toLowerCase();

    /*
     * =====================================================
     * SAVE GET RESPONSE TO CACHE
     * =====================================================
     */

    if (
      method === "get" &&
      !response.config.__fromCache
    ) {
      const cacheKey =
        createCacheKey(
          response.config
        );

      apiCache.set(cacheKey, {
        data: response.data,
        status: response.status,
        statusText:
          response.statusText,
        headers:
          response.headers,
        timestamp: Date.now(),
      });

      console.log(
        `💾 CACHE SAVED: ${response.config.url}`
      );
    }

    /*
     * =====================================================
     * DATABASE CHANGE
     * =====================================================
     *
     * Clear cache again after successful mutation.
     *
     * This is intentionally done here too,
     * so cache remains clean even if request
     * interceptors are changed later.
     */

    if (
      method === "post" ||
      method === "put" ||
      method === "patch" ||
      method === "delete"
    ) {
      console.log(
        `🧹 Cache cleared after ${method.toUpperCase()}: ${response.config.url}`
      );

      clearApiCache();
    }

    return response;
  },

  async (error) => {
    /*
     * =====================================================
     * 401 AUTH ERROR
     * =====================================================
     *
     * Backend returns 401
     *       ↓
     * Axios interceptor
     *       ↓
     * logout()
     *       ↓
     * Token removed
     *       ↓
     * Cache removed
     *       ↓
     * RootLayout receives false
     *       ↓
     * User goes to login
     */

    if (
      error.response?.status === 401
    ) {
      console.log(
        "🔒 Token invalid or expired."
      );

      try {
        await logout();
      } catch (logoutError) {
        console.error(
          "❌ Automatic logout error:",
          logoutError
        );
      }
    }

    return Promise.reject(error);
  }
);

export default API;

