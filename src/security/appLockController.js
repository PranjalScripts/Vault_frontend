// OS authentication guards the app; it never replaces the vault encryption password.
export function createAppLockController({ read, write, authenticate, available, now = Date.now, graceMs = 120000 }) {
  let state = { ready: false, enabled: false, locked: true, busy: false, backgrounded: false, error: '' };
  let active = true;
  let loading;
  let backgroundAt = null;
  let lockVersion = 0;
  const listeners = new Set();
  const update = patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const snapshot = () => state;
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  const initialize = () => loading ||= (async () => {
    try { const enabled = await read(); update({ enabled, locked: enabled, ready: true, error: '' }); }
    catch { update({ ready: false, locked: true, error: 'Unable to read security settings. Please retry.' }); }
    finally { loading = undefined; }
  })();
  const foreground = value => {
    if (!value && active) backgroundAt = now();
    const expired = value && backgroundAt !== null && now() - backgroundAt >= graceMs;
    active = value;
    if (value) backgroundAt = null;
    update({ backgrounded: !value, ...(expired && state.enabled ? { locked: true } : {}) });
  };
  const screenLocked = () => {
    lockVersion++;
    if (state.enabled) update({ locked: true });
  };
  const verify = async () => {
    const version = lockVersion;
    if (!(await available())) throw Error('Set up a fingerprint, Face ID, or screen lock in your phone settings first.');
    const result = await authenticate();
    if (!result.success) throw Error(result.error === 'lockout'
      ? 'Biometrics are temporarily locked. Try again using your phone’s device lock.'
      : 'Verification was not completed. Please try again.');
    // Never expose the app behind an interrupted authentication dialog.
    if (!active || version !== lockVersion) throw Error('Return to Vault and tap Unlock to continue.');
  };
  const unlock = async () => {
    if (!state.ready || !state.enabled || state.busy || !active) return;
    update({ busy: true, error: '' });
    try { await verify(); update({ locked: false }); }
    catch (e) { update({ locked: true, error: e.message || 'Unable to verify. Please try again.' }); }
    finally { update({ busy: false }); }
  };
  const setEnabled = async enabled => {
    if (!state.ready || state.busy || !active || enabled === state.enabled) return;
    update({ busy: true, error: '' });
    const version = lockVersion;
    try {
      await verify();
      await write(enabled);
      update({ enabled, locked: enabled && (!active || version !== lockVersion) });
    } catch (e) { update({ error: e.message || 'Unable to update app lock. Please try again.' }); }
    finally { update({ busy: false }); }
  };
  return { snapshot, subscribe, initialize, foreground, screenLocked, unlock, setEnabled };
}
