import { safeNotificationRoute } from "@/notifications/routes";
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import API, { forceRefresh } from '@/api/client';
import { AppLayout } from '@/components/AppLayout';
import { useTheme } from '@/hooks/use-theme';
import { InboxNotification, useNotificationInbox } from '@/notifications/inbox';

const icons = { tasks: 'check-circle', study: 'book-open', interview: 'briefcase', games: 'play-circle', security: 'shield', recovery: 'key', updates: 'download' } as const;
export default function NotificationsScreen() {
  const theme = useTheme(), router = useRouter(), { owner, refresh, unread } = useNotificationInbox();
  const [items, setItems] = useState<InboxNotification[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const sequence = useRef(0);
  const load = useCallback(async (before?: string) => {
    if (!owner) return;
    const ticket = ++sequence.current;
    setLoading(true); setError('');
    try {
      const response = await forceRefresh('/notifications', { params: { unread: unreadOnly ? '1' : '0', ...(before ? { before } : {}) } });
      if (ticket !== sequence.current) return;
      setItems(previous => before ? [...new Map([...previous, ...response.data.data].map(item => [item._id, item])).values()] : response.data.data);
      setCursor(response.data.nextCursor);
      void refresh();
    } catch { if (ticket === sequence.current) setError('Could not load notifications. Check your connection and try again.'); }
    finally { if (ticket === sequence.current) setLoading(false); }
  }, [owner, unreadOnly, refresh]);
  useEffect(() => {
    setItems([]); setCursor(null); void load();
    // Invalidate every pending request when account/filter changes or on unmount.
    const requests = sequence;
    return () => { requests.current++; };
  }, [load]);
  useEffect(() => {
    // Poll only the first page; don't discard a user's loaded history while reading.
    const timer = setInterval(() => { if (AppState.currentState === 'active' && (typeof document === 'undefined' || !document.hidden) && items.length <= 30 && !busy) void load(); }, 30000);
    return () => clearInterval(timer);
  }, [load, items.length, busy]);
  const open = async (item: InboxNotification) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await API.patch(`/notifications/${item._id}/read`);
      void refresh(); router.push(safeNotificationRoute(item.route) as never);
    } catch { setError('Could not mark this notification as read. Please try again.'); }
    finally { setBusy(false); }
  };
  const changeItem = async (item: InboxNotification, remove: boolean) => {
    setBusy(true); setError('');
    try { if (remove) await API.delete(`/notifications/${item._id}`); else await API.patch(`/notifications/${item._id}/read`); await load(); await refresh(); }
    catch { setError('Could not update this notification. Please try again.'); }
    finally { setBusy(false); }
  };
  const markAll = async () => {
    setBusy(true); setError('');
    try { await API.post('/notifications/read-all'); await load(); await refresh(); }
    catch { setError('Could not mark notifications as read. Please try again.'); }
    finally { setBusy(false); }
  };
  return <AppLayout scrollable={false} mobileTitle="Notifications" mobileBackAction={() => router.back()} mobileBackLabel="Go back" showMobileSearch={false}>
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={theme.accent} />}><View style={{ width: '100%', maxWidth: 780, alignSelf: 'center', padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <View><Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: '800', color: theme.text }}>Your notifications</Text><Text style={{ color: theme.textSecondary, marginTop: 4 }}>A little help keeping things moving.</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notification settings" onPress={() => router.push({ pathname: '/settings', params: { section: 'notifications' } })} style={{ padding: 12 }}><Feather name="settings" size={21} color={theme.accent} /></Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/reminders' as never)} style={{ paddingVertical: 12 }}><Text style={{ color: theme.accent }}>Manage scheduled reminders</Text></Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {[false, true].map(value => <Pressable key={String(value)} accessibilityRole="button" accessibilityState={{ selected: unreadOnly === value }} onPress={() => setUnreadOnly(value)} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 22, backgroundColor: unreadOnly === value ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.accent, fontWeight: '600' }}>{value ? `Unread (${unread})` : 'All'}</Text></Pressable>)}
        <Pressable accessibilityRole="button" disabled={busy || !unread} onPress={() => void markAll()} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, opacity: busy || !unread ? .5 : 1 }}><Text style={{ color: theme.accent }}>Mark all read</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh notifications" disabled={loading} onPress={() => void load()} style={{ padding: 12 }}><Feather name="refresh-cw" size={18} color={theme.accent} /></Pressable>
      </View>
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.text }}>{error}</Text>}
      {loading && <ActivityIndicator color={theme.accent} />}
      {!loading && !items.length && !error && <View style={{ padding: 28, alignItems: 'center', gap: 10 }}><Feather name="bell" size={32} color={theme.accent} /><Text style={{ color: theme.text, fontWeight: '700', fontSize: 18 }}>{unreadOnly ? 'All caught up' : 'Nothing here yet'}</Text><Text style={{ color: theme.textSecondary, textAlign: 'center', lineHeight: 21 }}>Reminders for your tasks, study, interview prep and games will appear here automatically.</Text></View>}
      {items.map(item => <Pressable key={item._id} accessibilityRole="button" accessibilityLabel={`${!item.readAt && !item.resolvedAt ? 'Unread. ' : ''}${item.title}. ${item.body}`} disabled={busy} onPress={() => void open(item)}
        style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: !item.readAt && !item.resolvedAt ? theme.accentMuted : theme.backgroundElement, opacity: pressed ? .75 : 1 })}>
        <Feather name={icons[item.category]} size={22} color={theme.accent} />
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{item.title}</Text>
          <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>{item.body}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}{item.resolvedAt ? ' · No longer pending' : ''}</Text>
        </View>
        <View style={{ gap: 8 }}>{!item.readAt && <Pressable accessibilityRole="button" accessibilityLabel="Mark as read" disabled={busy} onPress={event => { event.stopPropagation(); void changeItem(item, false); }} style={{ padding: 10 }}><Feather name="check" size={18} color={theme.accent} /></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Delete notification" disabled={busy} onPress={event => { event.stopPropagation(); void changeItem(item, true); }} style={{ padding: 10 }}><Feather name="trash-2" size={18} color={theme.textSecondary} /></Pressable></View>
        {!item.readAt && !item.resolvedAt && <View style={{ width: 7, height: 7, borderRadius: 4, marginTop: 5, backgroundColor: theme.accent }} />}
      </Pressable>)}
      {cursor && <Pressable accessibilityRole="button" disabled={loading} onPress={() => void load(cursor)} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: theme.accent }}>Load older notifications</Text></Pressable>}
    </View></ScrollView>
  </AppLayout>;
}
