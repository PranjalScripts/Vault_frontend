import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getFreshVault,
  changeVaultPassword as changeVaultPasswordApi,
  getAuthToken,
  getVault,
  createVault,
  subscribeToAuthChanges,
} from "../api/api";

import {
  rewrapVaultCredentials,
  createVaultCredentials,
} from "../crypto/vaultCrypto";

import { unlockStoredVault } from "../crypto/unlockStoredVault";

// =========================================================
// TYPES
// =========================================================

type VaultStatus = "loading" | "setup" | "locked" | "unlocked";

type VaultContextType = {
  status: VaultStatus;

  isLoading: boolean;
  isVaultCreated: boolean;
  isVaultUnlocked: boolean;

  vaultKey: string | null;

  setupVault: (vaultPassword: string) => Promise<void>;

  unlockVault: (vaultPassword: string) => Promise<boolean>;

  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  lockVault: () => void;

  refreshVault: () => Promise<void>;

  completeVaultRecovery: (masterVaultKey: string) => void;
};

// =========================================================
// CONTEXT
// =========================================================

const VaultContext = createContext<VaultContextType | undefined>(undefined);

// =========================================================
// PROVIDER
// =========================================================

const VAULT_SESSION_KEY = "vault_master_key_session_v2";
const VAULT_LAST_ACTIVE_KEY = "vault_session_active";
const VAULT_LOCK_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Session persistence is optional; blocked/full browser storage must not turn a
// successful decrypt into an apparent incorrect-password failure.
function saveVaultSession(key: string | null) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (key) {
      sessionStorage.setItem(VAULT_SESSION_KEY, key);
      sessionStorage.setItem(VAULT_LAST_ACTIVE_KEY, Date.now().toString());
    } else {
      sessionStorage.removeItem(VAULT_SESSION_KEY);
      sessionStorage.removeItem(VAULT_LAST_ACTIVE_KEY);
    }
  } catch { /* Keep the vault session in memory only. */ }
}

export const VaultProvider = ({ children }: { children: React.ReactNode }) => {
  // =======================================================
  // STATE
  // =======================================================

  const unlockPending = useRef<Promise<boolean> | null>(null);
  const vaultGeneration = useRef(0);

  const [status, setStatus] = useState<VaultStatus>("loading");

  const [vaultKey, setVaultKey] = useState<string | null>(null);

  const [vaultSalt, setVaultSalt] = useState<string | null>(null);

  const [passwordWrappedVaultKey, setPasswordWrappedVaultKey] =
    useState<any>(null);

  const [vaultVerifier, setVaultVerifier] = useState<any>(null);

  // =======================================================
  // LOAD VAULT
  // =======================================================

  const refreshVault = useCallback(async () => {
    const generation = ++vaultGeneration.current;
    try {
      setStatus("loading");

      /*
       * Ask backend whether this user
       * already has a vault.
       */

      const response = await getVault();
      if (generation !== vaultGeneration.current) return;

      /*
       * Vault exists.
       */

      if (response?.data?.success && response?.data?.data) {
        const {
          passwordSalt,
          passwordWrappedVaultKey: storedPasswordWrappedVaultKey,
          verifier,
        } = response.data.data;

        setVaultSalt(passwordSalt);
        setPasswordWrappedVaultKey(storedPasswordWrappedVaultKey);
        setVaultVerifier(verifier);

        // Check if we have an active in-session key that hasn't expired
        let restored = false;
        if (typeof sessionStorage !== "undefined") {
          const savedKey = sessionStorage.getItem(VAULT_SESSION_KEY);
          const lastActive = parseInt(
            sessionStorage.getItem(VAULT_LAST_ACTIVE_KEY) || "0",
            10,
          );

          if (savedKey && Date.now() - lastActive < VAULT_LOCK_TIMEOUT) {
            setVaultKey(savedKey);
            setStatus("unlocked");
            sessionStorage.setItem(
              VAULT_LAST_ACTIVE_KEY,
              Date.now().toString(),
            );
            restored = true;
          }
        }

        if (!restored) {
          setVaultKey(null);
          setStatus("locked");
        }

        return;
      }

      /*
       * Unexpected response without vault data.
       */

      setVaultSalt(null);
      setPasswordWrappedVaultKey(null);
      setVaultVerifier(null);
      setVaultKey(null);

      setStatus("setup");
    } catch (error: any) {
      if (generation !== vaultGeneration.current) return;
      /*
       * 404 is expected for a new user.
       */

      if (error?.response?.status === 404) {
        console.log("🔐 No vault found. Setup required.");

        setVaultSalt(null);
        setPasswordWrappedVaultKey(null);
        setVaultVerifier(null);
        setVaultKey(null);

        setStatus("setup");

        return;
      }

      /*
       * Other errors should NOT be treated
       * as "vault doesn't exist".
       */

      console.error("❌ Failed to load vault:", error);

      /*
       * Keep the vault locked rather than
       * accidentally showing setup.
       */

      setStatus("locked");
    }
  }, []);

  // =======================================================
  // INITIAL VAULT CHECK & AUTO-LOCK TIMER
  // =======================================================

  useEffect(() => {
    let mounted = true;
    const invalidatePendingUnlock = () => { ++vaultGeneration.current; };

    const loadVaultIfAuthenticated = async (authenticated: boolean) => {
      if (!authenticated || !mounted) {
        return;
      }

      await refreshVault();
    };

    const unsubscribe = subscribeToAuthChanges((authenticated: boolean) => {
      if (!authenticated) {
        ++vaultGeneration.current;
        saveVaultSession(null);
        setVaultSalt(null);
        setPasswordWrappedVaultKey(null);
        setVaultVerifier(null);
        setVaultKey(null);
        setStatus("loading");
        return;
      }

      loadVaultIfAuthenticated(true);
    });

    getAuthToken().then((token) => {
      loadVaultIfAuthenticated(!!token);
    });

    return () => {
      mounted = false;
      invalidatePendingUnlock();
      unsubscribe();
    };
  }, [refreshVault]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof sessionStorage !== "undefined") {
        const savedKey = sessionStorage.getItem(VAULT_SESSION_KEY);
        const lastActive = parseInt(
          sessionStorage.getItem(VAULT_LAST_ACTIVE_KEY) || "0",
          10,
        );

        if (savedKey && Date.now() - lastActive > VAULT_LOCK_TIMEOUT) {
          console.log("🔒 Vault session timed out. Locking...");
          sessionStorage.removeItem(VAULT_SESSION_KEY);
          sessionStorage.removeItem(VAULT_LAST_ACTIVE_KEY);
          setVaultKey(null);
          setStatus("locked");
        }
      }
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // =======================================================
  // CREATE FIRST VAULT
  // =======================================================
  //
  // Flow:
  //
  // User password
  //       ↓
  // createVaultCredentials()
  //       ↓
  // random salt
  //       ↓
  // PBKDF2
  //       ↓
  // Vault Key
  //       ↓
  // AES-256-GCM
  //       ↓
  // encrypted verifier
  //
  // Backend receives ONLY:
  //
  // salt
  // verifier
  //
  // Vault Key stays in memory.
  //
  // =======================================================

  const setupVault = useCallback(
    async (vaultPassword: string) => {
      if (!vaultPassword) {
        throw new Error("Vault password is required");
      }

      /*
       * IMPORTANT:
       * Never create another vault if one already exists.
       */
      if (status === "locked" || status === "unlocked") {
        throw new Error("Vault already exists. Please unlock your vault.");
      }

      try {
        setStatus("loading");

        const credentials = await createVaultCredentials(vaultPassword);

        await createVault({
          salt: credentials.salt,
          masterVaultKey: credentials.masterVaultKey,
          passwordWrappedVaultKey: credentials.passwordWrappedVaultKey,
          verifier: credentials.verifier,
        });

        setVaultSalt(credentials.salt);
        setPasswordWrappedVaultKey(credentials.passwordWrappedVaultKey);
        setVaultVerifier(credentials.verifier);
        setVaultKey(credentials.masterVaultKey);

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(VAULT_SESSION_KEY, credentials.masterVaultKey);
          sessionStorage.setItem(VAULT_LAST_ACTIVE_KEY, Date.now().toString());
        }

        setStatus("unlocked");

        console.log("✅ Vault created and unlocked");
      } catch (error: any) {
        console.error("❌ Vault setup failed:", error);

        setVaultKey(null);
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(VAULT_SESSION_KEY);
          sessionStorage.removeItem(VAULT_LAST_ACTIVE_KEY);
        }

        /*
         * Backend says vault already exists.
         */
        if (
          error?.response?.status === 409 ||
          error?.response?.data?.message === "Vault already exists"
        ) {
          console.log("⚠️ Vault already exists.");

          /*
           * Get the existing vault data.
           */
          await refreshVault();

          throw new Error("Vault already exists. Please unlock your vault.");
        }

        setStatus("setup");

        throw error;
      }
    },
    [status, refreshVault],
  );

  // =======================================================
  // UNLOCK EXISTING VAULT
  // =======================================================
  //
  // Existing:
  //
  // salt
  // verifier
  //
  // User enters password.
  //
  // password + salt
  //       ↓
  // PBKDF2
  //       ↓
  // Vault Key
  //       ↓
  // decrypt verifier
  //       ↓
  // compare
  //       ↓
  // Vault Key
  //
  // =======================================================

  const unlockVault = useCallback(
    (vaultPassword: string): Promise<boolean> => {
      if (unlockPending.current) return unlockPending.current;
      if (!vaultPassword) return Promise.resolve(false);
      const generation = vaultGeneration.current;
      const run = async () => {
        try {
          const { key, credentials } = await unlockStoredVault(vaultPassword, {
            passwordSalt: vaultSalt, passwordWrappedVaultKey, verifier: vaultVerifier,
          }, getFreshVault);
          if (generation !== vaultGeneration.current) {
            throw new Error('Your vault session changed. Please try unlocking again.');
          }
          setVaultSalt(credentials.passwordSalt);
          setPasswordWrappedVaultKey(credentials.passwordWrappedVaultKey);
          setVaultVerifier(credentials.verifier);
          setVaultKey(key);
          saveVaultSession(key);
          setStatus('unlocked');
          return true;
        } catch (error) {
          if (generation === vaultGeneration.current) {
            setVaultKey(null);
            setStatus('locked');
            saveVaultSession(null);
          }
          throw error;
        } finally {
          unlockPending.current = null;
        }
      };
      unlockPending.current = run();
      return unlockPending.current;
    },
    [passwordWrappedVaultKey, vaultSalt, vaultVerifier],
  );

  const completeVaultRecovery = useCallback((masterVaultKey: string) => {
    ++vaultGeneration.current;
    if (!masterVaultKey) {
      return;
    }

    console.log("RECOVERY MASTER KEY LENGTH:", masterVaultKey?.length);

    setVaultKey(masterVaultKey);
    setStatus("unlocked");

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(VAULT_SESSION_KEY, masterVaultKey);
      sessionStorage.setItem(VAULT_LAST_ACTIVE_KEY, Date.now().toString());
    }
  }, []);

  // =======================================================
  // LOCK VAULT
  // =======================================================
  //
  // No API request is needed.
  //
  // Simply remove the Vault Key
  // from memory.
  //
  // =======================================================

  const lockVault = useCallback(() => {
    ++vaultGeneration.current;
    console.log("🔒 Vault locked");

    /*
     * Destroy the in-memory reference.
     */

    setVaultKey(null);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(VAULT_SESSION_KEY);
      sessionStorage.removeItem(VAULT_LAST_ACTIVE_KEY);
    }

    if (vaultSalt) {
      setStatus("locked");
    } else {
      setStatus("setup");
    }
  }, [vaultSalt]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    ++vaultGeneration.current;
    const response = await getFreshVault();
    const credentials = await rewrapVaultCredentials(currentPassword, newPassword, response.data.data);
    await changeVaultPasswordApi(credentials);
    ++vaultGeneration.current;
    setVaultSalt(credentials.passwordSalt);
    setPasswordWrappedVaultKey(credentials.passwordWrappedVaultKey);
    setVaultVerifier(credentials.verifier);
    setVaultKey(null);
    setStatus("locked");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(VAULT_SESSION_KEY);
      sessionStorage.removeItem(VAULT_LAST_ACTIVE_KEY);
    }
  }, []);

  // =======================================================
  // DERIVED STATES
  // =======================================================

  const isLoading = status === "loading";

  const isVaultCreated = status === "locked" || status === "unlocked";

  const isVaultUnlocked = status === "unlocked";

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value = useMemo(
    () => ({
      status,

      isLoading,

      isVaultCreated,

      isVaultUnlocked,

      vaultKey,

      setupVault,

      unlockVault,

      lockVault,

      refreshVault,

      completeVaultRecovery,
      changePassword,
    }),
    [
      status,
      isLoading,
      isVaultCreated,
      isVaultUnlocked,
      vaultKey,
      setupVault,
      unlockVault,
      lockVault,
      refreshVault,
      completeVaultRecovery,
      changePassword,
    ],
  );

  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
};

// =========================================================
// HOOK
// =========================================================

export const useVault = () => {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error("useVault must be used inside VaultProvider");
  }

  return context;
};

export default VaultContext;
