import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import API, { forceRefresh } from '@/api/client';
import { AppLayout } from '@/components/AppLayout';
import { useTheme } from '@/hooks/use-theme';
import { useNotificationInbox } from '@/notifications/inbox';

type Frequency = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly';
type Reminder = { _id: string; entityType: 'todo' | 'subject'; entityId: string; topicId?: string; reminderAt: string; enabled: boolean; timeZone: string; label?: string; recurrence: { frequency: Frequency; weekdays: number[] } };
const localInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
export default function RemindersScreen() {
  const theme = useTheme(), router = useRouter(), params = useLocalSearchParams<{ entityType?: string; entityId?: string; topicId?: string; label?: string }>();
  const { owner } = useNotificationInbox();
  const [target, setTarget] = useState(params), [at, setAt] = useState(localInput(new Date(Date.now() + 3600000)));
  const [frequency, setFrequency] = useState<Frequency>('none'), [weekdays, setWeekdays] = useState([1, 2, 3, 4, 5]);
  const [items, setItems] = useState<Reminder[]>([]), [cursor, setCursor] = useState<string | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const account = useRef(owner); account.current = owner;
  const requestSequence = useRef(0);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const load = useCallback(async (before?: string) => {
    const requestOwner = account.current, ticket = ++requestSequence.current;
    if (!requestOwner) return;
    const response = await forceRefresh('/notifications/reminders', { params: before ? { before } : {} });
    if (account.current !== requestOwner || ticket !== requestSequence.current) return;
    setItems(previous => before ? [...previous, ...response.data.data] : response.data.data); setCursor(response.data.nextCursor);
  }, []);
  useEffect(() => { setItems([]); setCursor(null); setMessage(''); setTarget(params); void load().catch(() => setMessage('Could not load reminders. Please retry.')); return () => { requestSequence.current++; }; }, [owner, load, params.entityId, params.topicId]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    const requestOwner = account.current;
    setBusy(true); setMessage('');
    try { await action(); if (requestOwner === account.current) await load(); }
    catch (error: any) { setMessage(error?.response?.data?.message || error?.message || 'Could not update reminders. Please retry.'); }
    finally { setBusy(false); }
  };
  const save = () => run(async () => {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(at)) throw new Error('Use YYYY-MM-DD HH:mm, for example 2026-10-01 09:00.');
    const date = new Date(at.replace(' ', 'T') + ':00');
    if (!Number.isFinite(+date) || localInput(date) !== at || +date <= Date.now()) throw new Error('Choose a valid future local date and time.');
    await API.put('/notifications/reminders', { entityType: target.entityType, entityId: target.entityId, topicId: target.topicId || null, reminderAt: date.toISOString(), timeZone: zone, recurrence: { frequency, weekdays: frequency === 'weekdays' ? weekdays : [] } });
    setMessage('Reminder saved. It will be processed by the next cron run after this time.');
  });
  const button = (label: string, action: () => void, selected = false) => <Pressable key={label} accessibilityRole="button" disabled={busy} onPress={action} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: selected ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.accent }}>{label}</Text></Pressable>;
  return <AppLayout mobileTitle="Scheduled reminders" mobileBackAction={() => router.back()} showMobileSearch={false}><View style={{ maxWidth: 760, width: '100%', alignSelf: 'center', padding: 16, gap: 16 }}>
    <Text style={{ color: theme.text, fontSize: 26, fontWeight: '700' }}>Scheduled reminders</Text>
    <Text style={{ color: theme.textSecondary }}>Use “Remind me” on a task, subject or topic to set a reminder. Repeating reminders continue while the item is unfinished.</Text>
    {target.entityId && <View style={{ gap: 12, padding: 16, backgroundColor: theme.backgroundElement, borderRadius: 16 }}>
      <Text style={{ color: theme.text, fontWeight: '700' }}>{target.label || `${target.entityType === 'todo' ? 'Task' : 'Study'} reminder`}</Text>
      <Text style={{ color: theme.textSecondary }}>Local date and time ({zone})</Text>
      <TextInput accessibilityLabel="Reminder date and time" placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={theme.textSecondary} value={at} onChangeText={setAt} autoCapitalize="none" style={{ color: theme.text, padding: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 10 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['none', 'daily', 'weekly', 'weekdays', 'monthly'] as const).map(value => button(value === 'none' ? 'Once' : value === 'weekdays' ? 'Selected weekdays' : value[0].toUpperCase() + value.slice(1), () => setFrequency(value), frequency === value))}</View>
      {frequency === 'weekdays' && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => button(day, () => setWeekdays(old => old.includes(index) ? old.filter(d => d !== index) : [...old, index]), weekdays.includes(index)))}</View>}
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>The first reminder uses the date above. Monthly repeats use that day, or the last day of shorter months.</Text>
      {button('Save reminder', () => void save(), true)}
    </View>}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
    {busy && <ActivityIndicator color={theme.accent} />}
    {button('Refresh reminders', () => void run(async () => {}))}
    {items.map(item => <View key={item._id} style={{ padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 16, gap: 10 }}>
      <Text style={{ color: theme.text, fontWeight: '700' }}>{item.label || (item.entityType === 'todo' ? 'Task reminder' : 'Study reminder')}</Text>
      <Text style={{ color: theme.textSecondary }}>{new Date(item.reminderAt).toLocaleString()} · {item.recurrence.frequency} · {item.enabled ? 'Scheduled' : 'Inactive'}{`\n${item.timeZone}`}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>{button('Edit', () => { setTarget({ entityType: item.entityType, entityId: item.entityId, topicId: item.topicId, label: item.label }); setAt(localInput(new Date(Math.max(+new Date(item.reminderAt), Date.now() + 3600000)))); setFrequency(item.recurrence.frequency); setWeekdays(item.recurrence.weekdays); })}{item.enabled && button('Cancel', () => void run(async () => { await API.delete(`/notifications/reminders/${item._id}`); setMessage('Reminder cancelled.'); }))}</View>
    </View>)}
    {cursor && button('Load more', () => { setBusy(true); void load(cursor).catch(() => setMessage('Could not load more reminders.')).finally(() => setBusy(false)); })}
  </View></AppLayout>;
}
