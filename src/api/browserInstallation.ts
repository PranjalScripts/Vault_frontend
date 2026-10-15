const KEY = "vault-browser-installation-id";
const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function createInstallationId() {
  try {
    const cryptoApi = globalThis.crypto;
    if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
    if (typeof cryptoApi?.getRandomValues !== "function") return null;

    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    return null;
  }
}

/**
 * Stable, opaque identity for this browser's local-storage installation.
 * Intentionally survives Vault logout; Chrome and Safari have separate storage.
 */
export function getBrowserInstallationId() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const existing = window.localStorage.getItem(KEY);
    if (existing && UUID_V4.test(existing)) return existing;

    const id = createInstallationId();
    if (id) window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    // If storage or secure randomness is unavailable, login still works with
    // the legacy per-login behavior instead of blocking authentication.
    return null;
  }
}
