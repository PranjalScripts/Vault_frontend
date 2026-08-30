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

/*
 * =========================================================
 * API CACHE
 * =========================================================
 */

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
    config.headers?.authorization ||
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

  for (const key of Array.from(apiCache.keys())) {
    if (
      key.includes(`:${url}:`) ||
      key.endsWith(`:${url}`) ||
      key.includes(`:${url}?`)
    ) {
      apiCache.delete(key);
    }
  }
};

/*
 * =========================================================
 * CLEAR PASSCODE CACHE
 * =========================================================
 *
 * Passcodes have multiple cache keys because of:
 *
 * page
 * limit
 * search
 * sort
 *
 * Therefore we clear the entire /passcodes cache.
 */

export const clearPasscodeCache = () => {
  console.log("🗑️ Clearing PASSCODE cache");

  clearApiCacheFor("/passcodes");
};

/*
 * =========================================================
 * FORCE REFRESH
 * =========================================================
 *
 * Clears cache for a specific GET endpoint and
 * immediately performs a fresh API request.
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
     * Always clear cache.
     */
    clearApiCache();

    /*
     * Always notify application.
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
 * Cached for 10 minutes.
 */

export const getSubjects = () => {
  return API.get(
    "/subjects/getAll-subjects"
  );
};

/*
 * Force fresh subjects request.
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
      ...(status && status !== "all"
        ? { status }
        : {}),
    },
  });
};

export const createTodo = (
  todoData
) => {
  return API.post(
    "/todos",
    todoData
  );
};

export const updateTodo = (
  todoId,
  todoData
) => {
  return API.put(
    `/todos/${todoId}`,
    todoData
  );
};

export const deleteTodo = (
  todoId
) => {
  return API.delete(
    `/todos/${todoId}`
  );
};

/*
 * =========================================================
 * VAULT
 * =========================================================
 */

/**
 * @typedef {Object} VaultMetadata
 * @property {string} salt
 * @property {string} wrappedVaultKey
 * @property {string} wrapNonce
 * @property {string} wrapAuthTag
 */

/**
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getVault = () => {
  return API.get("/vault");
};

/**
 * @param {VaultMetadata} vaultData
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const createVault = (vaultData) => {
  return API.post("/vault", vaultData);
};

/*
 * =========================================================
 * PASSCODES
 * =========================================================
 */

/*
 * =========================================================
 * ENCRYPTED PASSWORD FORMAT
 * =========================================================
 *
 * Backend expects:
 *
 * {
 *   ciphertext: "...",
 *   nonce: "...",
 *   authTag: "..."
 * }
 *
 * IMPORTANT:
 * Do NOT use `iv`.
 */

/*
 * =========================================================
 * GET PASSCODES
 * =========================================================
 *
 * Normal GET.
 *
 * Cached for 10 minutes.
 *
 * Every combination of:
 *
 * page
 * limit
 * search
 * sort
 *
 * gets its own cache entry.
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
      ...(search.trim()
        ? {
            search: search.trim(),
          }
        : {}),
      sort,
    },
  });
};

/*
 * =========================================================
 * REFRESH PASSCODES
 * =========================================================
 *
 * IMPORTANT:
 *
 * This bypasses the existing passcode cache.
 *
 * Use this when:
 *
 * - User pulls to refresh
 * - User presses Refresh
 * - Screen needs latest data
 * - Returning to passcode screen
 *
 * Example:
 *
 * await refreshPasscodes({
 *   page: 1,
 *   limit: 20,
 *   search: "",
 *   sort: "newest"
 * });
 */

export const refreshPasscodes = ({
  page = 1,
  limit = 20,
  search = "",
  sort = "newest",
} = {}) => {
  clearPasscodeCache();

  return API.get("/passcodes", {
    params: {
      page,
      limit,
      ...(search.trim()
        ? {
            search: search.trim(),
          }
        : {}),
      sort,
    },
  });
};

/*
 * =========================================================
 * CREATE PASSCODE
 * =========================================================
 *
 * `password` MUST already be encrypted.
 *
 * Expected:
 *
 * {
 *   platform: "Instagram",
 *   username: "testuser",
 *   password: {
 *     ciphertext: "...",
 *     nonce: "...",
 *     authTag: "..."
 *   }
 * }
 */

export const createPasscode = (
  passcodeData
) => {
  return API.post(
    "/passcodes",
    passcodeData
  );
};

/*
 * =========================================================
 * UPDATE PASSCODE
 * =========================================================
 *
 * If password is supplied, it MUST already be
 * encrypted.
 *
 * Expected:
 *
 * {
 *   username: "newusername",
 *   password: {
 *     ciphertext: "...",
 *     nonce: "...",
 *     authTag: "..."
 *   }
 * }
 */

export const updatePasscode = (
  id,
  data
) => {
  return API.put(
    `/passcodes/${id}`,
    data
  );
};

/*
 * =========================================================
 * DELETE PASSCODE
 * =========================================================
 */

export const deletePasscode = (
  passcodeId
) => {
  return API.delete(
    `/passcodes/${passcodeId}`
  );
};

/*
 * =========================================================
 * VAULT SECURITY
 * =========================================================
 */

/*
 * =========================================================
 * GET VAULT CONFIG
 * =========================================================
 *
 * Backend returns:
 *
 * {
 *   hasVault: true,
 *   vaultSalt: "...",
 *   vaultVerifier: {
 *     ciphertext: "...",
 *     nonce: "...",
 *     authTag: "..."
 *   }
 * }
 *
 * Raw vault password/key is NEVER returned.
 */

export const getVaultConfig = () => {
  return API.get(
    "/passcodes/vault"
  );
};

/*
 * =========================================================
 * CREATE VAULT
 * =========================================================
 *
 * vaultSalt:
 * Random salt generated on frontend.
 *
 * vaultVerifier:
 * Encrypted verifier.
 *
 * Raw vault password is NEVER sent.
 */

// export const createVault = (
//   vaultSalt,
//   vaultVerifier
// ) => {
//   return API.post(
//     "/passcodes/vault",
//     {
//       vaultSalt,
//       vaultVerifier,
//     }
//   );
// };

/*
 * =========================================================
 * AXIOS REQUEST INTERCEPTOR
 * =========================================================
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
         * =================================================
         * CACHE STILL VALID
         * =================================================
         */

        if (
          age < API_CACHE_TIME
        ) {
          console.log(
            `📦 CACHE HIT: ${config.url}`
          );

          /*
           * Return cached response
           * without network request.
           */

          config.adapter = async () => {
            return {
              data: cached.data,
              status:
                cached.status || 200,
              statusText:
                cached.statusText || "OK",
              headers:
                cached.headers || {},
              config,
              request: null,
            };
          };

          config.__fromCache = true;
        } else {
          /*
           * =================================================
           * CACHE EXPIRED
           * =================================================
           */

          console.log(
            `⏰ CACHE EXPIRED: ${config.url}`
          );

          apiCache.delete(
            cacheKey
          );
        }
      } else {
        console.log(
          `🌐 CACHE MISS: ${config.url}`
        );
      }
    }

    /*
     * =====================================================
     * DATABASE MODIFYING REQUEST
     * =====================================================
     *
     * Any mutation means server data may
     * have changed.
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
        status:
          response.status,
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
     * Clear cache after successful mutation.
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
     * Backend
     *   ↓
     * 401
     *   ↓
     * Axios interceptor
     *   ↓
     * logout()
     *   ↓
     * Token removed
     *   ↓
     * Cache removed
     *   ↓
     * RootLayout notified
     *   ↓
     * Login screen
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