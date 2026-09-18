import { pbkdf2, getRandomBytes, encryptAES, decryptAsyncAES } from "rn-encryption";

// =========================================================
// CRYPTO VERSION
// =========================================================

export const VAULT_CRYPTO_VERSION = 1;

// =========================================================
// CRYPTO PARAMETERS
// =========================================================

const KEY_LENGTH = 32; // 32 bytes = AES-256

const SALT_LENGTH = 32; // 32 random bytes

const PBKDF2_ITERATIONS = 200000;

const PBKDF2_HASH = "SHA-256";

// =========================================================
// VERIFIER
// =========================================================

const VERIFIER_TEXT = "VAULT_VERIFIER_V1";

// =========================================================
// VALIDATION
// =========================================================

const validatePassword = (password) => {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Vault password is required");
  }
};

const validateSalt = (salt) => {
  if (typeof salt !== "string" || salt.length === 0) {
    throw new Error("Vault salt is required");
  }
};

const validateVaultKey = (vaultKey) => {
  if (typeof vaultKey !== "string" || vaultKey.length === 0) {
    throw new Error("Vault Key is required");
  }
};

// =========================================================
// GENERATE RANDOM MASTER VAULT KEY
// =========================================================
//
// The Master Vault Key is a random key used to encrypt
// all passcodes stored in the vault.
//
// This key is itself encrypted with the vault password
// (via the Vault Key) so that if the user changes their
// password, they don't need to re-encrypt all passcodes.
//
// =========================================================

export const generateMasterVaultKey = async () => {
  try {
    const masterKey = await getRandomBytes(KEY_LENGTH);

    if (typeof masterKey !== "string" || masterKey.length === 0) {
      throw new Error("Unable to generate master vault key");
    }

    return masterKey;
  } catch (error) {
    console.error("MASTER VAULT KEY GENERATION ERROR:", error);

    throw new Error("Unable to generate master vault key");
  }
};

// =========================================================
// GENERATE RANDOM VAULT SALT
// =========================================================
//
// IMPORTANT:
//
// rn-encryption behaves differently internally:
//
// Native:
//   getRandomBytes() -> string
//
// Web:
//   getRandomBytes() -> Promise<string>
//
// Therefore this function MUST be async.
//
// =========================================================

export const generateVaultSalt = async () => {
  try {
    const salt = await getRandomBytes(SALT_LENGTH);

    if (typeof salt !== "string" || salt.length === 0) {
      throw new Error("Unable to generate vault salt");
    }

    return salt;
  } catch (error) {
    console.error("VAULT SALT GENERATION ERROR:", error);

    throw new Error("Unable to generate vault salt");
  }
};

// =========================================================
// DERIVE VAULT KEY
// =========================================================
//
// Password
//    +
// Salt
//    ↓
// PBKDF2-HMAC-SHA256
//    ↓
// 256-bit Vault Key
//
// rn-encryption:
// Native -> synchronous
// Web    -> asynchronous
//
// Therefore this function is async.
//
// =========================================================

export const deriveVaultKey = async (password, salt) => {
  validatePassword(password);
  validateSalt(salt);

  try {
    const vaultKey = await pbkdf2(
      password,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_HASH,
    );

    if (typeof vaultKey !== "string" || vaultKey.length === 0) {
      throw new Error("Vault Key derivation failed");
    }

    return vaultKey;
  } catch {
    const failure = new Error("Unable to unlock on this device. Please try again.");
    failure.code = "VAULT_CRYPTO_UNAVAILABLE";
    throw failure;
  }
};

// =========================================================
// ENCRYPT WITH VAULT KEY
// =========================================================
//
// AES-256-GCM
//
// IMPORTANT:
//
// rn-encryption encryptAES() returns its own
// encrypted representation.
//
// We store that complete encrypted string
// as `ciphertext`.
//
// Backend does NOT need to understand the
// cryptography.
//
// Example:
//
// {
//   ciphertext: "..."
// }
//
// This also avoids depending on the output
// structure of react-native-aes-gcm-crypto.
//
// =========================================================

export const encryptWithVaultKey = async (plaintext, vaultKey) => {
  if (typeof plaintext !== "string") {
    throw new Error("Plaintext must be a string");
  }

  validateVaultKey(vaultKey);

  try {
    const encrypted = await encryptAES(plaintext, vaultKey);

    if (typeof encrypted !== "string" || encrypted.length === 0) {
      throw new Error("Invalid AES-GCM encryption result");
    }

    const fullBytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    if (fullBytes.length >= 28) {
      const nonceBytes = fullBytes.slice(0, 12);
      const ciphertextBytes = fullBytes.slice(12, fullBytes.length - 16);
      const authTagBytes = fullBytes.slice(fullBytes.length - 16);

      return {
        ciphertext: btoa(String.fromCharCode(...ciphertextBytes)),
        nonce: btoa(String.fromCharCode(...nonceBytes)),
        authTag: btoa(String.fromCharCode(...authTagBytes)),
      };
    }

    return {
      ciphertext: encrypted,
      nonce: "none",
      authTag: "none",
    };
  } catch (error) {
    console.error("VAULT ENCRYPTION ERROR:", error);

    throw new Error("Unable to encrypt vault data");
  }
};

// =========================================================
// DECRYPT WITH VAULT KEY
// =========================================================

export const decryptWithVaultKey = async (encryptedData, vaultKey) => {
  validateVaultKey(vaultKey);

  if (!encryptedData || typeof encryptedData !== "object") {
    throw new Error("Encrypted data is required");
  }

  const { ciphertext, nonce, authTag } = encryptedData;

  if (typeof ciphertext !== "string" || ciphertext.length === 0) {
    throw new Error("Invalid encrypted data");
  }

  try {
    let payload = ciphertext;

    if (
      typeof nonce === "string" &&
      typeof authTag === "string" &&
      nonce.length > 0 &&
      authTag.length > 0 &&
      nonce !== "none"
    ) {
      const nonceBytes = Uint8Array.from(atob(nonce), (c) => c.charCodeAt(0));
      const cipherBytes = Uint8Array.from(atob(ciphertext), (c) =>
        c.charCodeAt(0),
      );
      const tagBytes = Uint8Array.from(atob(authTag), (c) => c.charCodeAt(0));
      const fullBytes = new Uint8Array([
        ...nonceBytes,
        ...cipherBytes,
        ...tagBytes,
      ]);
      payload = btoa(String.fromCharCode(...fullBytes));
    }

    const plaintext = await decryptAsyncAES(payload, vaultKey);

    if (typeof plaintext !== "string") {
      throw new Error("Invalid decrypted data");
    }

    return plaintext;
  } catch {
    // Authentication failures are handled by the caller, not the native error overlay.
    const failure = new Error("Unable to decrypt vault data");
    failure.code = "VAULT_DECRYPTION_FAILED";
    throw failure;
  }
};

// =========================================================
// CREATE VAULT CREDENTIALS
// =========================================================

export const createVaultCredentials = async (password) => {
  validatePassword(password);

  try {
    // =====================================================
    // 1. Generate random salt
    // =====================================================

    const salt = await generateVaultSalt();

    // =====================================================
    // 2. Generate random Master Vault Key
    // =====================================================
    //
    // This key will be used to encrypt all passcodes.
    // It's stored in encrypted form (wrapped).
    //
    // =====================================================

    const masterVaultKey = await generateMasterVaultKey();

    // =====================================================
    // 3. Derive Vault Key from password + salt
    // =====================================================

    const vaultKey = await deriveVaultKey(password, salt);

    // =====================================================
    // 4. Wrap Master Vault Key with Vault Key
    // =====================================================
    //
    // This creates passwordWrappedVaultKey
    // (encrypted with password-derived key)
    //
    // =====================================================

    const passwordWrappedVaultKey = await encryptWithVaultKey(
      masterVaultKey,
      vaultKey,
    );

    // =====================================================
    // 5. Create verifier by encrypting known text
    // =====================================================

    const verifier = await encryptWithVaultKey(VERIFIER_TEXT, vaultKey);

    // =====================================================
    // 6. Return credentials
    // =====================================================

    return {
      version: VAULT_CRYPTO_VERSION,

      salt,

      masterVaultKey,

      passwordWrappedVaultKey,

      verifier,

      // NEVER send this to backend.
      vaultKey,
    };
  } catch (error) {
    console.error("CREATE VAULT CREDENTIALS ERROR:", error);

    throw new Error("Unable to create vault credentials");
  }
};

// =========================================================
// UNLOCK EXISTING VAULT
// =========================================================
//
// Existing:
//
// salt
// verifier
//
// User enters password:
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
//
// =========================================================

export const unlockVault = async (
  password,
  salt,
  passwordWrappedVaultKey,
  verifier,
) => {
  validatePassword(password);
  validateSalt(salt);

  if (!passwordWrappedVaultKey || typeof passwordWrappedVaultKey !== "object") {
    throw new Error("Password wrapped vault key is required");
  }

  if (!verifier || typeof verifier !== "object") {
    throw new Error("Vault verifier is required");
  }

  try {
    // -----------------------------------------------------
    // 1. Derive Vault Key
    // -----------------------------------------------------

    const vaultKey = await deriveVaultKey(password, salt);

    // -----------------------------------------------------
    // 2. Decrypt verifier and wrapped master key
    // -----------------------------------------------------

    const decryptedVerifier = await decryptWithVaultKey(verifier, vaultKey);

    const masterVaultKey = await decryptWithVaultKey(
      passwordWrappedVaultKey,
      vaultKey,
    );

    // -----------------------------------------------------
    // 3. Validate
    // -----------------------------------------------------

    if (decryptedVerifier !== VERIFIER_TEXT || !masterVaultKey) {
      throw new Error("Invalid vault password");
    }

    // -----------------------------------------------------
    // 4. Success
    // -----------------------------------------------------

    return masterVaultKey;
  } catch (error) {
    if (error.code === "VAULT_CRYPTO_UNAVAILABLE") throw error;
    const failure = new Error("Could not unlock your vault. Check your password and try again. If it is correct, your vault data may need recovery.");
    failure.code = "VAULT_UNLOCK_FAILED";
    throw failure;
  }
};

// =========================================================
// VERIFY VAULT KEY
// =========================================================
//
// Used when we already have a Vault Key.
//
// Returns:
//
// true  -> valid key
// false -> invalid key
//
// =========================================================

export const verifyVaultKey = async (vaultKey, verifier) => {
  try {
    validateVaultKey(vaultKey);

    if (!verifier || typeof verifier !== "object") {
      return false;
    }

    const decryptedVerifier = await decryptWithVaultKey(verifier, vaultKey);

    return decryptedVerifier === VERIFIER_TEXT;
  } catch {
    return false;
  }
};

// =========================================================
// GET CRYPTO CONFIG
// =========================================================

export const getVaultCryptoConfig = () => {
  return {
    version: VAULT_CRYPTO_VERSION,

    algorithm: "AES-256-GCM",

    keyLength: KEY_LENGTH,

    saltLength: SALT_LENGTH,

    kdf: "PBKDF2-HMAC-SHA256",

    pbkdf2Iterations: PBKDF2_ITERATIONS,

    pbkdf2Hash: PBKDF2_HASH,

    verifier: VERIFIER_TEXT,
  };
};

// Rewrap the existing master key; never replace the key that encrypts passcodes.
export const rewrapVaultCredentials = async (currentPassword, newPassword, stored) => {
  if (typeof newPassword !== "string" || newPassword.trim().length < 4) throw new Error("Use at least 4 characters for the new password");
  if (newPassword !== newPassword.trim()) throw new Error("The new password cannot start or end with spaces");
  if (currentPassword === newPassword) throw new Error("Choose a different password");
  const masterVaultKey = await unlockVault(currentPassword, stored.passwordSalt, stored.passwordWrappedVaultKey, stored.verifier);
  const passwordSalt = await generateVaultSalt();
  const wrappingKey = await deriveVaultKey(newPassword, passwordSalt);
  const passwordWrappedVaultKey = await encryptWithVaultKey(masterVaultKey, wrappingKey);
  const verifier = await encryptWithVaultKey(VERIFIER_TEXT, wrappingKey);
  return { previousPasswordSalt: stored.passwordSalt, passwordSalt, passwordWrappedVaultKey, verifier };
};
