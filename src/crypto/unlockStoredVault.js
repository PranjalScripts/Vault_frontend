import { unlockVault } from './vaultCrypto';

// A password change on another device can leave the in-memory wrapping data stale.
// Retry only with fresh server credentials; never reset or replace encrypted data.
export async function unlockStoredVault(password, stored, fetchFresh) {
  const attempt = credentials => unlockVault(password, credentials.passwordSalt, credentials.passwordWrappedVaultKey, credentials.verifier);
  if (stored?.passwordSalt && stored?.passwordWrappedVaultKey && stored?.verifier) {
    try {
      return { key: await attempt(stored), credentials: stored };
    } catch (error) {
      if (error.code !== 'VAULT_UNLOCK_FAILED') throw error;
    }
  }
  let credentials;
  try {
    const response = await fetchFresh();
    credentials = response?.data?.data;
    if (!credentials?.passwordSalt || !credentials?.passwordWrappedVaultKey || !credentials?.verifier) {
      throw new Error('Missing vault credentials');
    }
  } catch {
    throw new Error('Unable to refresh your vault. Check your connection and try again.');
  }
  return { key: await attempt(credentials), credentials };
}
