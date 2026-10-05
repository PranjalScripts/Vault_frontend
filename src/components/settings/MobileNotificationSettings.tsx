import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSettingsPalette } from '@/hooks/use-settings-palette';
import type { Preferences } from '@/components/ReminderSettings';
import { SettingsRow, SettingsSwitch, type SettingsIconName, type SettingsTone } from './SettingsPrimitives';

const categories: { key: keyof Pick<Preferences, 'tasks' | 'study' | 'interview' | 'agenda' | 'streaks' | 'security' | 'recovery' | 'updates' | 'games'>; title: string; description: string; icon: SettingsIconName; tone?: SettingsTone }[] = [
  { key: 'tasks', title: 'Tasks', description: 'Scheduled task reminders and one alert when a task becomes overdue.', icon: 'checkmark-circle-outline', tone: 'orange' },
  { key: 'study', title: 'Subjects and topics', description: 'A weekly nudge after three days without study progress.', icon: 'book-outline' },
  { key: 'interview', title: 'Interview prep', description: 'Resume unrevised questions after a day, or review after a week.', icon: 'stats-chart-outline', tone: 'blue' },
  { key: 'agenda', title: 'Daily agenda', description: 'A morning summary of pending tasks due today.', icon: 'calendar-outline' },
  { key: 'streaks', title: 'Streak reminders', description: 'A reminder to continue an active study or game streak.', icon: 'flame-outline', tone: 'orange' },
  { key: 'security', title: 'Security alerts', description: 'Logins, new devices and password changes.', icon: 'lock-closed-outline' },
  { key: 'recovery', title: 'Recovery alerts', description: 'Changes to your Vault recovery protection.', icon: 'key-outline', tone: 'red' },
  { key: 'updates', title: 'App updates', description: 'New Vault versions for your registered devices.', icon: 'download-outline', tone: 'blue' },
  { key: 'games', title: 'Games', description: 'A daily reminder unless you have completed a game or puzzle today.', icon: 'game-controller-outline' },
];
export default function MobileNotificationSettings({ preferences, busy, push, available, pushAvailable, error, message, save, changePush, testPush, pushStatus, pushError, pushDiagnostics, retry }: {
  preferences: Preferences | null; busy: boolean; push: boolean; available: boolean; pushAvailable: boolean;
  error: string; message: string; save: (patch: Partial<Preferences>) => Promise<void>; changePush: () => Promise<void>; testPush: () => Promise<void>; pushStatus: string; pushError: string; pushDiagnostics: any; retry: () => void;
}) {
  const p = useSettingsPalette();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const card = { backgroundColor: p.card, borderWidth: 1, borderColor: p.border, borderRadius: 18, overflow: 'hidden' as const };
  if (!preferences) return <View style={{ ...card, padding: 24, gap: 16 }}>
    {error ? <><Text accessibilityRole="alert" style={{ color: p.danger }}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={{ paddingVertical: 12 }}><Text style={{ color: p.accent }}>Try again</Text></Pressable></> : <ActivityIndicator accessibilityLabel="Loading notification preferences" color={p.accent} />}
  </View>;
  return <View style={{ gap: 12 }}>
    <SettingsRow compact title="Automatic notifications" description="Reminders arrive in your inbox on every device." icon="notifications-outline"
      trailing={<SettingsSwitch label="Automatic notifications" value={preferences.enabled} disabled={busy} onChange={value => void save({ enabled: value })} />} />
    {!!pushDiagnostics && <Text style={{ color: p.secondary, fontSize: 12 }}>Push service: {pushDiagnostics.configured ? 'ready' : 'not configured'} · Worker: {pushDiagnostics.worker?.online ? 'online' : 'offline'} · Devices: {pushDiagnostics.devices?.length || 0} · Pending: {pushDiagnostics.pending || 0} · Failed: {pushDiagnostics.failed || 0}</Text>}
    <View style={card}>
      {categories.map(item => <View key={item.key}>
        <SettingsRow {...item} compact borderless trailing={<SettingsSwitch label={item.title} value={preferences[item.key]} disabled={busy || !preferences.enabled} onChange={value => void save({ [item.key]: value })} />} />
        <View style={{ height: 1, backgroundColor: p.border, marginHorizontal: 14 }} />
      </View>)}
      <SettingsRow compact borderless title="Phone alerts on this device" description="Get alerts even when Vault is closed. Your phone will ask permission." icon="call-outline"
        trailing={<SettingsSwitch label="Phone alerts on this device" value={push} disabled={busy} onChange={() => void changePush()} />} />
    </View>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void testPush()} style={{ minHeight: 48, borderRadius: 14, backgroundColor: p.mint, alignItems: 'center', justifyContent: 'center', opacity: busy ? .55 : 1 }}><Text style={{ color: p.accent, fontWeight: '700' }}>{busy ? 'Sending…' : 'Send test push to this device'}</Text></Pressable>
    {!!pushStatus && <Text accessibilityLiveRegion="polite" style={{ color: p.accent, fontSize: 13 }}>{pushStatus}</Text>}
    {!!pushError && <Text accessibilityRole="alert" style={{ color: p.danger, fontSize: 13 }}>{pushError}</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: p.danger, fontSize: 13, lineHeight: 19 }}>{error}</Text>}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: p.accent, fontSize: 13 }}>{message}</Text>}
    {(!available || !pushAvailable) && <Text style={{ color: p.secondary, fontSize: 12, lineHeight: 18 }}>Some alerts are temporarily unavailable. Your preferences are saved.</Text>}
    <View style={card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: scheduleOpen }} onPress={() => setScheduleOpen(value => !value)} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
        <Feather name="moon" size={20} color={p.accent} /><Text style={{ color: p.text, fontSize: 14, flex: 1, fontWeight: '600' }}>Quiet hours &amp; schedule</Text><Feather name={scheduleOpen ? 'chevron-up' : 'chevron-down'} size={18} color={p.secondary} />
      </Pressable>
      {scheduleOpen && <View style={{ padding: 16, paddingTop: 0, gap: 20 }}>
        <Text style={{ color: p.secondary, fontSize: 12, lineHeight: 18 }}>Choose when reminders arrive. Login security alerts bypass quiet hours.</Text>
        {(['agendaHour', 'gameHour', 'streakHour'] as const).map((key, index) => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: p.text, flex: 1, fontSize: 13 }}>{['Daily agenda', 'Game reminder', 'Streak reminder'][index]}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Earlier ${key}`} disabled={busy} onPress={() => void save({ [key]: (preferences[key] + 23) % 24 })} style={{ padding: 12 }}><Feather name="minus" size={18} color={p.accent} /></Pressable>
          <Text style={{ color: p.text, fontVariant: ['tabular-nums'] }}>{String(preferences[key]).padStart(2, '0')}:00</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Later ${key}`} disabled={busy} onPress={() => void save({ [key]: (preferences[key] + 1) % 24 })} style={{ padding: 12 }}><Feather name="plus" size={18} color={p.accent} /></Pressable>
        </View>)}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[{ label: '10 PM – 8 AM', start: 22, end: 8 }, { label: '11 PM – 7 AM', start: 23, end: 7 }, { label: 'Off', start: 0, end: 0 }].map(option => {
            const selected = preferences.quietStart === option.start && preferences.quietEnd === option.end;
            return <Pressable key={option.label} accessibilityRole="radio" accessibilityState={{ checked: selected }} disabled={busy} onPress={() => void save({ quietStart: option.start, quietEnd: option.end })} style={{ paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: 11, backgroundColor: selected ? p.mint : p.inset, borderWidth: 1, borderColor: selected ? p.accent : p.border }}><Text style={{ color: selected ? p.accent : p.secondary, fontSize: 12 }}>{option.label}</Text></Pressable>;
          })}
        </View>
        <Text style={{ color: p.secondary, fontSize: 12 }}>Time zone: {preferences.timeZone}</Text>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' })} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: p.accent }}>Use this device’s time zone</Text></Pressable>
      </View>}
    </View>
    <Pressable accessibilityRole="button" onPress={() => { void Linking.openSettings().catch(() => setPermissionError('Open your phone settings to manage Vault notification permissions.')); }} style={{ paddingVertical: 14, flexDirection: 'row', gap: 10, justifyContent: 'center' }}><Feather name="external-link" size={16} color={p.secondary} /><Text style={{ color: p.secondary, fontSize: 13 }}>Manage phone permissions</Text></Pressable>
    {!!permissionError && <Text accessibilityRole="alert" style={{ color: p.danger }}>{permissionError}</Text>}
  </View>;
}
