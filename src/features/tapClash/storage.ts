import { Platform } from 'react-native';
import { readSnapshotValue, writeSnapshotValue } from '@/notifications/snapshotStore';
import { decodeClash, StoredClash } from './stats';
const pending = new Map<string, Promise<void>>();
const keyFor = (user: string) => `vault-tap-clash-${user.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
export async function loadClash(user: string) {
  const key = keyFor(user); await pending.get(key)?.catch(() => {});
  return decodeClash(Platform.OS === 'web' ? localStorage.getItem(key) : await readSnapshotValue(key));
}
export function saveClash(user: string, data: StoredClash) {
  const key = keyFor(user), json = JSON.stringify(data);
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, json); return Promise.resolve(); } catch (error) { return Promise.reject(error); }
  }
  const next = (pending.get(key) ?? Promise.resolve()).catch(() => {}).then(() => writeSnapshotValue(key, json));
  pending.set(key, next); return next;
}
