import { Platform } from 'react-native';
import { readSnapshotValue, writeSnapshotValue } from '@/notifications/snapshotStore';
import { decodeState, SavedState } from './snapshot';
export { emptyState, decodeState } from './snapshot';
export type { SavedState } from './snapshot';
const writes = new Map<string, Promise<void>>();
const keyFor = (owner: string) => `vault-path-${owner.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
export async function loadState(owner: string) {
  const key = keyFor(owner); await writes.get(key)?.catch(() => {});
  const raw = Platform.OS === 'web' ? localStorage.getItem(key) : await readSnapshotValue(key);
  return decodeState(raw);
}
export function saveState(owner: string, state: SavedState) {
  const key = keyFor(owner), value = JSON.stringify(state);
  // Browser pagehide needs the snapshot committed before the handler returns.
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); return Promise.resolve(); }
    catch (error) { return Promise.reject(error); }
  }
  const write = (writes.get(key) ?? Promise.resolve()).catch(() => {}).then(async () => {
    await writeSnapshotValue(key, value);
  });
  writes.set(key, write);
  return write;
}
