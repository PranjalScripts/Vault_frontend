
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import {
  getVault,
  createVault,
} from "@/api/api";

import {
  gcm,
} from "@noble/ciphers/aes.js";

import {
  scrypt,
} from "@noble/hashes/scrypt.js";

import {
  bytesToHex,
  hexToBytes,
} from "@noble/hashes/utils.js";

/* =====================================================
   CONSTANTS
===================================================== */

const VAULT_LOCK_TIMEOUT = 5 * 60 * 1000;

const SALT_LENGTH = 16;
const VAULT_KEY_LENGTH = 32;
const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/*
 * PIN -> scrypt -> 32 byte AES key
 */
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

/*
 * Only NON-SECRET metadata is stored locally.
 *
 * The real vault key is NEVER stored.
 */
const LOCAL_SALT_KEY = "vault_salt";
const LOCAL_VAULT_CREATED_KEY = "vault_created";

/* =====================================================
   TYPES
===================================================== */

export type EncryptedValue = {
  ciphertext: string;
  nonce: string;
  authTag: string;
};

type VaultMetadata = {
  salt: string;
  wrappedVaultKey: string;
  wrapNonce: string;
  wrapAuthTag: string;
};

interface VaultContextType {
  isVaultCreated: boolean;
  isVaultUnlocked: boolean;

  isCreatingVault: boolean;
  isUnlockingVault: boolean;

  vaultLoading: boolean;

  createPin: (
    pin: string
  ) => Promise<boolean>;

  verifyPin: (
    pin: string
  ) => Promise<boolean>;

  unlockVault: (
    pin: string
  ) => Promise<boolean>;

  lockVault: () => void;

  encryptPassword: (
    password: string
  ) => Promise<EncryptedValue>;

  decryptPassword: (
    encrypted: EncryptedValue
  ) => Promise<string>;

  getVaultKey: () => Uint8Array;

  touchVault: () => void;

  refreshVault: () => Promise<void>;

  clearVault: () => Promise<void>;
}

/* =====================================================
   STORAGE
===================================================== */

const Storage = {
  async getItem(
    key: string
  ): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },

  async setItem(
    key: string,
    value: string
  ): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(
    key: string
  ): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

/* =====================================================
   IN-MEMORY VAULT KEY
===================================================== */

/*
 * IMPORTANT:
 *
 * The actual AES-256 vault key exists ONLY in memory.
 *
 * It is NEVER stored in:
 *
 * - AsyncStorage
 * - SecureStore
 * - localStorage
 * - sessionStorage
 * - backend
 *
 * After reload/restart:
 *
 * vaultKeyInMemory === null
 *
 * User must unlock again.
 */

let vaultKeyInMemory: Uint8Array | null = null;

/* =====================================================
   CONTEXT
===================================================== */

const VaultContext =
  createContext<VaultContextType | null>(null);

/* =====================================================
   RANDOM BYTES
===================================================== */

const randomBytes = (
  length: number
): Uint8Array => {
  const bytes = new Uint8Array(length);

  /*
   * Browser / Expo web.
   */
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(bytes);
    return bytes;
  }

  throw new Error(
    "Secure random generator is not available."
  );
};

/* =====================================================
   HEX HELPERS
===================================================== */

const ensureHex = (
  value: string,
  expectedBytes?: number
): Uint8Array => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(value)
  ) {
    throw new Error(
      "Invalid hexadecimal value."
    );
  }

  const bytes = hexToBytes(value);

  if (
    expectedBytes !== undefined &&
    bytes.length !== expectedBytes
  ) {
    throw new Error(
      "Invalid hexadecimal length."
    );
  }

  return bytes;
};

/* =====================================================
   DERIVE PIN WRAPPING KEY
===================================================== */

/*
 * PIN
 *   ↓
 * scrypt
 *   ↓
 * 32-byte AES key
 *
 * This key is used ONLY to unwrap
 * the random vault key.
 */

const derivePinKey = (
  pin: string,
  salt: Uint8Array
): Uint8Array => {
  return scrypt(
    new TextEncoder().encode(pin),
    salt,
    {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      dkLen: VAULT_KEY_LENGTH,
    }
  );
};

/* =====================================================
   AES-GCM ENCRYPT
===================================================== */

const encryptBytes = (
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array
): {
  ciphertext: Uint8Array;
  authTag: Uint8Array;
} => {
  /*
   * @noble/ciphers returns:
   *
   * ciphertext + authTag
   */

  const encrypted =
    gcm(key, nonce).encrypt(plaintext);

  const ciphertext =
    encrypted.slice(
      0,
      encrypted.length - AUTH_TAG_LENGTH
    );

  const authTag =
    encrypted.slice(
      encrypted.length - AUTH_TAG_LENGTH
    );

  return {
    ciphertext,
    authTag,
  };
};

/* =====================================================
   AES-GCM DECRYPT
===================================================== */

const decryptBytes = (
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  authTag: Uint8Array
): Uint8Array => {
  const combined =
    new Uint8Array(
      ciphertext.length + authTag.length
    );

  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  return gcm(key, nonce).decrypt(combined);
};

/* =====================================================
   PROVIDER
===================================================== */

export function VaultProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ===================================================
     STATE
  =================================================== */

  const [
    isVaultCreated,
    setIsVaultCreated,
  ] = useState(false);

  const [
    isVaultUnlocked,
    setIsVaultUnlocked,
  ] = useState(false);

  const [
    isCreatingVault,
    setIsCreatingVault,
  ] = useState(false);

  const [
    isUnlockingVault,
    setIsUnlockingVault,
  ] = useState(false);

  const [
    vaultLoading,
    setVaultLoading,
  ] = useState(true);

  const [
    lastActivity,
    setLastActivity,
  ] = useState(Date.now());

  const [
    vaultMetadata,
    setVaultMetadata,
  ] = useState<VaultMetadata | null>(null);

  /* ===================================================
     GET VAULT KEY
  =================================================== */

  const getVaultKey =
    useCallback((): Uint8Array => {
      if (!vaultKeyInMemory) {
        throw new Error(
          "Vault key not available. Please unlock the vault first."
        );
      }

      return vaultKeyInMemory;
    }, []);

  /* ===================================================
     TOUCH VAULT
  =================================================== */

  const touchVault =
    useCallback(() => {
      if (vaultKeyInMemory) {
        setLastActivity(Date.now());
      }
    }, []);

  /* ===================================================
     REFRESH VAULT
  =================================================== */

  const refreshVault =
    useCallback(async () => {
      try {
        setVaultLoading(true);

        const response = await getVault();

        const vault =
          response?.data?.data;

        /*
         * First-time user:
         *
         * Backend returns:
         * 404
         *
         * This is NORMAL.
         */

        if (
          response?.data?.success !== true ||
          !vault?.salt ||
          !vault?.wrappedVaultKey ||
          !vault?.wrapNonce ||
          !vault?.wrapAuthTag
        ) {
          setIsVaultCreated(false);
          setIsVaultUnlocked(false);
          setVaultMetadata(null);

          return;
        }

        const metadata: VaultMetadata = {
          salt: vault.salt,
          wrappedVaultKey:
            vault.wrappedVaultKey,
          wrapNonce:
            vault.wrapNonce,
          wrapAuthTag:
            vault.wrapAuthTag,
        };

        setVaultMetadata(metadata);

        setIsVaultCreated(true);

        /*
         * Backend existence != unlocked.
         *
         * Only true if actual vault key
         * exists in memory.
         */
        setIsVaultUnlocked(
          !!vaultKeyInMemory
        );

        /*
         * Store ONLY non-secret metadata.
         */
        await Storage.setItem(
          LOCAL_SALT_KEY,
          vault.salt
        );

        await Storage.setItem(
          LOCAL_VAULT_CREATED_KEY,
          "true"
        );
      } catch (error: any) {
        /*
         * 404 means:
         *
         * Vault has not been created yet.
         */

        if (
          error?.response?.status === 404
        ) {
          setIsVaultCreated(false);
          setIsVaultUnlocked(false);
          setVaultMetadata(null);

          return;
        }

        console.error(
          "REFRESH VAULT ERROR:",
          error
        );
      } finally {
        setVaultLoading(false);
      }
    }, []);

  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    refreshVault();
  }, [refreshVault]);

  /* ===================================================
     AUTO LOCK
  =================================================== */

  useEffect(() => {
    const interval =
      setInterval(() => {
        if (
          vaultKeyInMemory &&
          Date.now() - lastActivity >
            VAULT_LOCK_TIMEOUT
        ) {
          vaultKeyInMemory = null;

          setIsVaultUnlocked(false);

          console.log(
            "🔒 VAULT AUTO LOCKED"
          );
        }
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [lastActivity]);

  /* ===================================================
     CREATE PIN / FIRST VAULT
  =================================================== */

  const createPin =
    useCallback(
      async (
        pin: string
      ): Promise<boolean> => {
        if (
          !/^\d{4,}$/.test(pin)
        ) {
          throw new Error(
            "Vault PIN must contain at least 4 digits."
          );
        }

        if (isCreatingVault) {
          return false;
        }

        try {
          setIsCreatingVault(true);

          /*
           * ------------------------------------------------
           * STEP 1
           * Generate random salt.
           * ------------------------------------------------
           */

          const salt =
            randomBytes(SALT_LENGTH);

          /*
           * ------------------------------------------------
           * STEP 2
           * Generate completely random vault key.
           *
           * This is the ACTUAL key used to encrypt
           * passcodes.
           *
           * It is NOT the PIN.
           * ------------------------------------------------
           */

          const vaultKey =
            randomBytes(VAULT_KEY_LENGTH);

          /*
           * ------------------------------------------------
           * STEP 3
           * Derive PIN wrapping key.
           * ------------------------------------------------
           */

          const pinKey =
            derivePinKey(
              pin,
              salt
            );

          /*
           * ------------------------------------------------
           * STEP 4
           * Generate nonce for wrapping vault key.
           * ------------------------------------------------
           */

          const wrapNonce =
            randomBytes(NONCE_LENGTH);

          /*
           * ------------------------------------------------
           * STEP 5
           * Encrypt/wrap random vault key.
           * ------------------------------------------------
           */

          const {
            ciphertext,
            authTag,
          } =
            encryptBytes(
              vaultKey,
              pinKey,
              wrapNonce
            );

          /*
           * ------------------------------------------------
           * STEP 6
           * Send encrypted metadata to backend.
           *
           * Backend NEVER receives:
           *
           * - PIN
           * - PIN-derived key
           * - plaintext vault key
           * ------------------------------------------------
           */

          await createVault({
            salt: bytesToHex(salt),

            wrappedVaultKey:
              bytesToHex(ciphertext),

            wrapNonce:
              bytesToHex(wrapNonce),

            wrapAuthTag:
              bytesToHex(authTag),
          });

          /*
           * ------------------------------------------------
           * STEP 7
           * Store metadata locally.
           *
           * These values are NOT secrets.
           * ------------------------------------------------
           */

          const saltHex =
            bytesToHex(salt);

          const wrappedVaultKeyHex =
            bytesToHex(ciphertext);

          const wrapNonceHex =
            bytesToHex(wrapNonce);

          const wrapAuthTagHex =
            bytesToHex(authTag);

          await Storage.setItem(
            LOCAL_SALT_KEY,
            saltHex
          );

          await Storage.setItem(
            LOCAL_VAULT_CREATED_KEY,
            "true"
          );

          /*
           * ------------------------------------------------
           * STEP 8
           * Keep metadata in React state.
           * ------------------------------------------------
           */

          setVaultMetadata({
            salt: saltHex,

            wrappedVaultKey:
              wrappedVaultKeyHex,

            wrapNonce:
              wrapNonceHex,

            wrapAuthTag:
              wrapAuthTagHex,
          });

          /*
           * ------------------------------------------------
           * STEP 9
           * VERY IMPORTANT
           *
           * Immediately unlock the vault.
           *
           * This allows the FIRST PASSCODE to be
           * encrypted immediately after PIN creation.
           * ------------------------------------------------
           */

          vaultKeyInMemory =
            new Uint8Array(vaultKey);

          setIsVaultCreated(true);

          setIsVaultUnlocked(true);

          setLastActivity(Date.now());

          console.log(
            "🔐 VAULT CREATED AND UNLOCKED"
          );

          return true;
        } catch (error: any) {
          console.error(
            "CREATE VAULT ERROR:",
            error
          );

          /*
           * Never keep a key if creation failed.
           */
          vaultKeyInMemory = null;

          setIsVaultCreated(false);
          setIsVaultUnlocked(false);

          throw new Error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to create vault."
          );
        } finally {
          setIsCreatingVault(false);
        }
      },
      [isCreatingVault]
    );

  /* ===================================================
     VERIFY / UNLOCK PIN
  =================================================== */

  const verifyPin =
    useCallback(
      async (
        pin: string
      ): Promise<boolean> => {
        if (
          !/^\d{4,}$/.test(pin)
        ) {
          return false;
        }

        if (isUnlockingVault) {
          return false;
        }

        try {
          setIsUnlockingVault(true);

          /*
           * ---------------------------------------------
           * Get vault metadata.
           *
           * If state doesn't have it,
           * load it from backend.
           * ---------------------------------------------
           */

          let metadata =
            vaultMetadata;

          if (!metadata?.salt) {
            try {
              const response =
                await getVault();

              const vault =
                response?.data?.data;

              if (
                response?.data?.success !==
                  true ||
                !vault?.salt ||
                !vault?.wrappedVaultKey ||
                !vault?.wrapNonce ||
                !vault?.wrapAuthTag
              ) {
                setIsVaultCreated(false);
                return false;
              }

              metadata = {
                salt: vault.salt,

                wrappedVaultKey:
                  vault.wrappedVaultKey,

                wrapNonce:
                  vault.wrapNonce,

                wrapAuthTag:
                  vault.wrapAuthTag,
              };

              setVaultMetadata(metadata);
              setIsVaultCreated(true);
            } catch (error: any) {
              if (
                error?.response?.status ===
                404
              ) {
                setIsVaultCreated(false);
                return false;
              }

              throw error;
            }
          }

          /*
           * ---------------------------------------------
           * Validate metadata.
           * ---------------------------------------------
           */

          if (
            !metadata.salt ||
            !metadata.wrappedVaultKey ||
            !metadata.wrapNonce ||
            !metadata.wrapAuthTag
          ) {
            throw new Error(
              "Vault metadata is incomplete."
            );
          }

          /*
           * ---------------------------------------------
           * Convert metadata from HEX.
           * ---------------------------------------------
           */

          const salt =
            ensureHex(
              metadata.salt,
              SALT_LENGTH
            );

          const wrappedVaultKey =
            ensureHex(
              metadata.wrappedVaultKey
            );

          const wrapNonce =
            ensureHex(
              metadata.wrapNonce,
              NONCE_LENGTH
            );

          const wrapAuthTag =
            ensureHex(
              metadata.wrapAuthTag,
              AUTH_TAG_LENGTH
            );

          /*
           * ---------------------------------------------
           * Derive PIN wrapping key.
           * ---------------------------------------------
           */

          const pinKey =
            derivePinKey(
              pin,
              salt
            );

          /*
           * ---------------------------------------------
           * Attempt to unwrap vault key.
           *
           * Wrong PIN causes AES-GCM authentication
           * failure.
           * ---------------------------------------------
           */

          const vaultKey =
            decryptBytes(
              wrappedVaultKey,
              pinKey,
              wrapNonce,
              wrapAuthTag
            );

          if (
            vaultKey.length !==
            VAULT_KEY_LENGTH
          ) {
            throw new Error(
              "Invalid vault key."
            );
          }

          /*
           * ---------------------------------------------
           * PIN CORRECT.
           *
           * Store actual vault key ONLY in memory.
           * ---------------------------------------------
           */

          vaultKeyInMemory =
            new Uint8Array(vaultKey);

          setIsVaultCreated(true);

          setIsVaultUnlocked(true);

          setLastActivity(Date.now());

          await Storage.setItem(
            LOCAL_SALT_KEY,
            metadata.salt
          );

          await Storage.setItem(
            LOCAL_VAULT_CREATED_KEY,
            "true"
          );

          console.log(
            "🔓 VAULT UNLOCKED"
          );

          return true;
        } catch (error) {
          console.error(
            "VERIFY VAULT PIN ERROR:",
            error
          );

          /*
           * Wrong PIN or corrupted metadata.
           *
           * Never keep an old key.
           */

          vaultKeyInMemory = null;

          setIsVaultUnlocked(false);

          return false;
        } finally {
          setIsUnlockingVault(false);
        }
      },
      [
        vaultMetadata,
        isUnlockingVault,
      ]
    );

  /* ===================================================
     UNLOCK ALIAS
  =================================================== */

  const unlockVault =
    useCallback(
      async (
        pin: string
      ): Promise<boolean> => {
        return verifyPin(pin);
      },
      [verifyPin]
    );

  /* ===================================================
     LOCK VAULT
  =================================================== */

  const lockVault =
    useCallback(() => {
      /*
       * Destroy the in-memory key.
       */

      vaultKeyInMemory = null;

      setIsVaultUnlocked(false);

      setLastActivity(Date.now());

      console.log(
        "🔒 VAULT LOCKED"
      );
    }, []);

  /* ===================================================
     ENCRYPT PASSWORD
  =================================================== */

  const encryptPassword =
    useCallback(
      async (
        password: string
      ): Promise<EncryptedValue> => {
        if (!password) {
          throw new Error(
            "Password is required."
          );
        }

        /*
         * Get actual vault key.
         *
         * Throws if vault is locked.
         */

        const vaultKey =
          getVaultKey();

        /*
         * Every passcode gets a UNIQUE nonce.
         */

        const nonce =
          randomBytes(
            NONCE_LENGTH
          );

        const plaintext =
          new TextEncoder().encode(
            password
          );

        const {
          ciphertext,
          authTag,
        } =
          encryptBytes(
            plaintext,
            vaultKey,
            nonce
          );

        touchVault();

        return {
          ciphertext:
            bytesToHex(ciphertext),

          nonce:
            bytesToHex(nonce),

          authTag:
            bytesToHex(authTag),
        };
      },
      [
        getVaultKey,
        touchVault,
      ]
    );

  /* ===================================================
     DECRYPT PASSWORD
  =================================================== */

  const decryptPassword =
    useCallback(
      async (
        encrypted: EncryptedValue
      ): Promise<string> => {
        if (
          !encrypted?.ciphertext ||
          !encrypted?.nonce ||
          !encrypted?.authTag
        ) {
          throw new Error(
            "Invalid encrypted password."
          );
        }

        /*
         * Get actual vault key.
         */

        const vaultKey =
          getVaultKey();

        const ciphertext =
          ensureHex(
            encrypted.ciphertext
          );

        const nonce =
          ensureHex(
            encrypted.nonce,
            NONCE_LENGTH
          );

        const authTag =
          ensureHex(
            encrypted.authTag,
            AUTH_TAG_LENGTH
          );

        const plaintext =
          decryptBytes(
            ciphertext,
            vaultKey,
            nonce,
            authTag
          );

        touchVault();

        return new TextDecoder().decode(
          plaintext
        );
      },
      [
        getVaultKey,
        touchVault,
      ]
    );

  /* ===================================================
     CLEAR LOCAL VAULT STATE
  =================================================== */

  const clearVault =
    useCallback(async () => {
      /*
       * WARNING:
       *
       * This clears LOCAL state only.
       *
       * It DOES NOT delete the backend vault.
       */

      vaultKeyInMemory = null;

      await Storage.deleteItem(
        LOCAL_SALT_KEY
      );

      await Storage.deleteItem(
        LOCAL_VAULT_CREATED_KEY
      );

      setVaultMetadata(null);

      setIsVaultCreated(false);

      setIsVaultUnlocked(false);

      setLastActivity(Date.now());

      console.log(
        "🧹 LOCAL VAULT STATE CLEARED"
      );
    }, []);

  /* ===================================================
     CONTEXT VALUE
  =================================================== */

  const value: VaultContextType = {
    isVaultCreated,

    isVaultUnlocked,

    isCreatingVault,

    isUnlockingVault,

    vaultLoading,

    createPin,

    verifyPin,

    unlockVault,

    lockVault,

    encryptPassword,

    decryptPassword,

    getVaultKey,

    touchVault,

    refreshVault,

    clearVault,
  };

  /* ===================================================
     PROVIDER
  =================================================== */

  return (
    <VaultContext.Provider
      value={value}
    >
      {children}
    </VaultContext.Provider>
  );
}

/* =====================================================
   HOOK
===================================================== */

export function useVault() {
  const context =
    useContext(VaultContext);

  if (!context) {
    throw new Error(
      "useVault must be used inside VaultProvider."
    );
  }

  return context;
}

export default VaultContext;

