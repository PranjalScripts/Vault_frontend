
import * as Crypto from "expo-crypto";
import { gcm } from "@noble/ciphers/aes.js";
import { scrypt } from "@noble/hashes/scrypt.js";
import {
  bytesToHex,
  hexToBytes,
} from "@noble/hashes/utils.js";

export const VAULT_CHECK_TEXT =
  "VAULT_CHECK_v1";

export const SALT_LENGTH = 16;
export const NONCE_LENGTH = 12;
export const KEY_LENGTH = 32;
export const AUTH_TAG_LENGTH = 16;

// scrypt configuration
export const SCRYPT_N = 32768;
export const SCRYPT_R = 8;
export const SCRYPT_P = 1;

// =====================================================
// TYPES
// =====================================================

export type EncryptedValue = {
  ciphertext: string;
  nonce: string;
  authTag: string;
};

// =====================================================
// RANDOM BYTES
// =====================================================

const randomBytes = (
  length: number
): Uint8Array => {
  const bytes =
    new Uint8Array(length);

  Crypto.getRandomValues(bytes);

  return bytes;
};

// =====================================================
// CREATE VAULT SALT
// =====================================================

export const createVaultSalt =
  (): string => {
    return bytesToHex(
      randomBytes(SALT_LENGTH)
    );
  };

// =====================================================
// DERIVE VAULT KEY
// =====================================================

export const deriveVaultKey = (
  vaultPin: string,
  saltHex: string
): Uint8Array => {
  if (!vaultPin) {
    throw new Error(
      "Vault PIN is required."
    );
  }

  if (!saltHex) {
    throw new Error(
      "Vault salt is required."
    );
  }

  const passwordBytes =
    new TextEncoder().encode(
      vaultPin
    );

  const saltBytes =
    hexToBytes(saltHex);

  return scrypt(
    passwordBytes,
    saltBytes,
    {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      dkLen: KEY_LENGTH,
    }
  );
};

// =====================================================
// ENCRYPT
// =====================================================

export const encryptValue = (
  plaintext: string,
  vaultKey: Uint8Array
): EncryptedValue => {
  if (!plaintext) {
    throw new Error(
      "Cannot encrypt empty value."
    );
  }

  if (
    !vaultKey ||
    vaultKey.length !== KEY_LENGTH
  ) {
    throw new Error(
      "Invalid vault key."
    );
  }

  const nonce =
    randomBytes(NONCE_LENGTH);

  const plaintextBytes =
    new TextEncoder().encode(
      plaintext
    );

  /*
   * noble AES-GCM returns:
   *
   * ciphertext + 16-byte authentication tag
   */
  const encrypted =
    gcm(
      vaultKey,
      nonce
    ).encrypt(plaintextBytes);

  const ciphertext =
    encrypted.slice(
      0,
      encrypted.length -
        AUTH_TAG_LENGTH
    );

  const authTag =
    encrypted.slice(
      encrypted.length -
        AUTH_TAG_LENGTH
    );

  return {
    ciphertext:
      bytesToHex(ciphertext),

    nonce:
      bytesToHex(nonce),

    authTag:
      bytesToHex(authTag),
  };
};

// =====================================================
// DECRYPT
// =====================================================

export const decryptValue = (
  encrypted: EncryptedValue,
  vaultKey: Uint8Array
): string => {
  if (
    !encrypted?.ciphertext ||
    !encrypted?.nonce ||
    !encrypted?.authTag
  ) {
    throw new Error(
      "Invalid encrypted value."
    );
  }

  if (
    !vaultKey ||
    vaultKey.length !== KEY_LENGTH
  ) {
    throw new Error(
      "Invalid vault key."
    );
  }

  const ciphertext =
    hexToBytes(
      encrypted.ciphertext
    );

  const nonce =
    hexToBytes(
      encrypted.nonce
    );

  const authTag =
    hexToBytes(
      encrypted.authTag
    );

  if (
    nonce.length !==
    NONCE_LENGTH
  ) {
    throw new Error(
      "Invalid nonce length."
    );
  }

  if (
    authTag.length !==
    AUTH_TAG_LENGTH
  ) {
    throw new Error(
      "Invalid authentication tag."
    );
  }

  /*
   * Reconstruct:
   *
   * ciphertext + authentication tag
   */
  const combined =
    new Uint8Array(
      ciphertext.length +
        authTag.length
    );

  combined.set(
    ciphertext,
    0
  );

  combined.set(
    authTag,
    ciphertext.length
  );

  const decrypted =
    gcm(
      vaultKey,
      nonce
    ).decrypt(combined);

  return new TextDecoder().decode(
    decrypted
  );
};

// =====================================================
// CREATE VAULT VERIFIER
// =====================================================

export const createVaultVerifier = (
  vaultKey: Uint8Array
): EncryptedValue => {
  return encryptValue(
    VAULT_CHECK_TEXT,
    vaultKey
  );
};

// =====================================================
// VERIFY VAULT KEY
// =====================================================

export const verifyVaultKey = (
  verifier: EncryptedValue,
  vaultKey: Uint8Array
): boolean => {
  try {
    const decrypted =
      decryptValue(
        verifier,
        vaultKey
      );

    return (
      decrypted ===
      VAULT_CHECK_TEXT
    );
  } catch {
    return false;
  }
};

