import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import API, { forceRefresh } from '@/api/client';
import { getAuthUser, subscribeToAuthChanges } from '@/api/auth';

type InboxContext = { unread: number; refresh: () => Promise<void>; owner: string };
const Context = createContext<InboxContext>({ unread: 0, refresh: async () => {}, owner: '' });
export const useNotificationInbox = () => useContext(Context);
export function NotificationProvider({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  const [unread, setUnread] = useState(0), [owner, setOwner] = useState('');
  const epoch = useRef(0), busy = useRef(false);
  const refresh = useCallback(async () => {
    if (!ready || !owner || busy.current) return;
    const generation = epoch.current;
    busy.current = true;
    try {
      const response = await forceRefresh('/notifications/unread-count');
      if (generation === epoch.current) setUnread(response.data.data.count);
    } catch { /* Inbox screen shows actionable errors; the bell keeps its last count. */ }
    finally { if (generation === epoch.current) busy.current = false; }
  }, [ready, owner]);
  const [authVersion, setAuthVersion] = useState(0);
  useEffect(() => subscribeToAuthChanges(() => { epoch.current++; setUnread(0); setOwner(''); setAuthVersion(value => value + 1); }), []);
  useEffect(() => {
    const generation = ++epoch.current;
    setUnread(0); setOwner(''); busy.current = false;
    if (ready) void getAuthUser().then(user => {
      if (generation === epoch.current) setOwner(String(user?._id || user?.id || ''));
    });
    return () => { epoch.current = generation + 1; };
  }, [ready, authVersion]);
  useEffect(() => {
    if (!owner) return;
    let active = true;
    void forceRefresh('/notifications/preferences').then(response => {
      if (active && !response.data.timeZoneConfigured) return API.put('/notifications/preferences', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });
    }).catch(() => {});
    const visible = () => AppState.currentState === 'active' && (typeof document === 'undefined' || !document.hidden);
    const refreshVisible = () => { if (visible()) void refresh(); };
    void refresh();
    const timer = setInterval(refreshVisible, 30000);
    const listener = AppState.addEventListener('change', refreshVisible);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', refreshVisible);
    return () => { active = false; clearInterval(timer); listener.remove(); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', refreshVisible); };
  }, [owner, refresh]);
  return <Context.Provider value={{ unread, refresh, owner }}>{children}</Context.Provider>;
}

export type InboxNotification = { _id: string; category: 'tasks' | 'study' | 'interview' | 'games' | 'security' | 'recovery' | 'updates'; title: string; body: string; route: string; readAt: string | null; resolvedAt: string | null; createdAt: string };
