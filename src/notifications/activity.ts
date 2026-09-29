import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import API from '@/api/client';
import { getAuthToken, getAuthUser, subscribeToAuthChanges } from '@/api/auth';

const sent = new Map<string, { signature: string; at: number }>();
const queues = new Map<string, Promise<void>>();
let generation = 0;
subscribeToAuthChanges(() => { generation++; sent.clear(); queues.clear(); });
export async function recordReminderActivity(activity: { kind: 'study'; subjectId: string; topicId?: string; completed?: boolean } | { kind: 'game'; key: string; unfinished: boolean; completed?: boolean }) {
  const epoch = generation;
  const user = await getAuthUser();
  const userId = user?._id || user?.id;
  if (!userId || epoch !== generation || !(await getAuthToken()) || epoch !== generation) return;
  const key = `${userId}:${activity.kind}:${activity.kind === 'game' ? activity.key : activity.subjectId}`;
  const signature = JSON.stringify(activity);
  const previous = sent.get(key);
  if (previous?.signature === signature && Date.now() - previous.at < 60000) return;
  const stamp = { signature, at: Date.now() };
  sent.set(key, stamp);
  // Preserve start/finish ordering even when requests have different latencies.
  const pending = (queues.get(key) || Promise.resolve()).then(async () => {
    if (epoch !== generation) return;
    try { await API.post('/notifications/activity', activity, { timeout: 10000 }); }
    catch { if (sent.get(key) === stamp) sent.delete(key); /* Never interrupt play or study. */ }
  });
  queues.set(key, pending);
  await pending;
  if (queues.get(key) === pending) queues.delete(key);
}

export function useGameReminderActivity(key: string, active: boolean, unfinished = false) {
  const latest = useRef({ active, unfinished }); latest.current = { active, unfinished };
  useEffect(() => {
    if (active) void recordReminderActivity({ kind: 'game', key, unfinished });
  }, [key, active, unfinished]);
  useEffect(() => {
    const record = () => { if (latest.current.active) void recordReminderActivity({ kind: 'game', key, unfinished: latest.current.unfinished }); };
    const interval = setInterval(() => { if (AppState.currentState === 'active' && (typeof document === 'undefined' || !document.hidden)) record(); }, 60000);
    const listener = AppState.addEventListener('change', record);
    return () => { clearInterval(interval); listener.remove(); record(); };
  }, [key]);
}

// Count a completion transition, never simply opening an old completed game.
export function useGameCompletion(key: string, completed: boolean, ready = true) {
  const previous = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    if (completed && previous.current === false) void recordReminderActivity({ kind: 'game', key, unfinished: false, completed: true });
    previous.current = completed;
  }, [key, completed, ready]);
}
