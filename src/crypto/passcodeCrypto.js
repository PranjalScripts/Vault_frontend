
import {
  encryptWithVaultKey,
  decryptWithVaultKey,
} from "./vaultCrypto";

// =====================================================
// VALIDATION
// =====================================================

const validateVaultKey = (vaultKey) => {
  if (
    typeof vaultKey !== "string" ||
    vaultKey.length === 0
  ) {
    throw new Error(
      "Vault Key is required"
    );
  }
};

const validatePassword = (password) => {
  if (
    typeof password !== "string"
  ) {
    throw new Error(
      "Passcode password must be a string"
    );
  }
};

// =====================================================
// ENCRYPT PASSCODE PASSWORD
// =====================================================
//
// User enters:
//
//     Facebook
//     username
//     mySecretPassword
//
// Only the password is encrypted here.
//
// platform and username remain searchable in MongoDB.
//
//
//
// plaintext password
//        ↓
//    Vault Key
//        ↓
//   AES-256-GCM
//        ↓
// {
//   ciphertext,
//   nonce,
//   authTag
// }
//
// =====================================================

export const encryptPasscodePassword = async (
  password,
  vaultKey
) => {
  validatePassword(password);
  validateVaultKey(vaultKey);

  try {
    return await encryptWithVaultKey(
      password,
      vaultKey
    );
  } catch (error) {
    console.error(
      "ENCRYPT PASSCODE PASSWORD ERROR:",
      error
    );

    throw new Error(
      "Unable to encrypt passcode password"
    );
  }
};

// =====================================================
// DECRYPT PASSCODE PASSWORD
// =====================================================
//
// MongoDB:
//
// password: {
//   ciphertext,
//   nonce,
//   authTag
// }
//
//        ↓
//
// decrypt using Vault Key
//
//        ↓
//
// original plaintext password
//
// =====================================================

export const decryptPasscodePassword = async (
  encryptedPassword,
  vaultKey
) => {
  validateVaultKey(vaultKey);

  if (
    !encryptedPassword ||
    typeof encryptedPassword !==
      "object"
  ) {
    throw new Error(
      "Encrypted passcode password is required"
    );
  }

  if (
    typeof encryptedPassword.ciphertext !==
      "string" ||
    typeof encryptedPassword.nonce !==
      "string" ||
    typeof encryptedPassword.authTag !==
      "string"
  ) {
    throw new Error(
      "Invalid encrypted passcode password"
    );
  }

  try {
    return await decryptWithVaultKey(
      encryptedPassword,
      vaultKey
    );
  } catch (error) {
    console.error(
      "DECRYPT PASSCODE PASSWORD ERROR:",
      error
    );

    throw new Error(
      "Unable to decrypt passcode password"
    );
  }
};

// =====================================================
// VALIDATE ENCRYPTED PASSWORD
// =====================================================
//
// Useful before sending a passcode to the backend.
//
// =====================================================

export const isEncryptedPasscodePassword = (
  encryptedPassword
) => {
  return (
    encryptedPassword &&
    typeof encryptedPassword ===
      "object" &&
    typeof encryptedPassword.ciphertext ===
      "string" &&
    encryptedPassword.ciphertext.length >
      0 &&
    typeof encryptedPassword.nonce ===
      "string" &&
    encryptedPassword.nonce.length >
      0 &&
    typeof encryptedPassword.authTag ===
      "string" &&
    encryptedPassword.authTag.length >
      0
  );
};

// =====================================================
// PREPARE PASSCODE FOR API
// =====================================================
//
// This function is optional but useful.
//
// It guarantees that plaintext password is encrypted
// before the API request.
//
// =====================================================

export const preparePasscodeForApi = async ({
  platform,
  username,
  password,
  vaultKey,
}) => {
  if (
    typeof platform !== "string" ||
    !platform.trim()
  ) {
    throw new Error(
      "Platform is required"
    );
  }

  if (
    typeof username !== "string" ||
    !username.trim()
  ) {
    throw new Error(
      "Username is required"
    );
  }

  validatePassword(password);
  validateVaultKey(vaultKey);

  const encryptedPassword =
    await encryptPasscodePassword(
      password,
      vaultKey
    );

  return {
    platform: platform.trim(),

    username: username.trim(),

    password: encryptedPassword,
  };
};

// =====================================================
// DECRYPT PASSCODE FOR DISPLAY
// =====================================================
//
// This should ONLY be called while the vault is
// unlocked and the Vault Key exists in memory.
//
// =====================================================

export const decryptPasscodeForDisplay =
  async (
    passcode,
    vaultKey
  ) => {
    if (!passcode) {
      throw new Error(
        "Passcode is required"
      );
    }

    validateVaultKey(vaultKey);

    const password =
      await decryptPasscodePassword(
        passcode.password,
        vaultKey
      );

    return {
      ...passcode,

      password,
    };
  };

