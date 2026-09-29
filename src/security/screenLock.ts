import { requireOptionalNativeModule } from 'expo';
import { AppState, Platform } from 'react-native';

type ScreenLockModule = {
  getLockVersion(): number;
  addListener(event: 'screenLocked', listener: () => void): { remove(): void };
};

export function observeScreenLock(lock: () => void) {
  const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<ScreenLockModule>('VaultScreenLock');
  let version = native?.getLockVersion();
  const check = () => {
    const next = native?.getLockVersion();
    if (next !== version) { version = next; lock(); }
  };
  const screen = native?.addListener('screenLocked', check);
  const lifecycle = AppState.addEventListener('change', state => {
    // Old binaries without the native module retain immediate locking until rebuilt.
    if (!native && state !== 'active') lock();
    else if (state === 'active') check();
  });
  return () => { screen?.remove(); lifecycle.remove(); };
}
