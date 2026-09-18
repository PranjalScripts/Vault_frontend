import { useEffect, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSettingsPalette } from "@/hooks/use-settings-palette";
import { defaultPreferences, getReminderScheduleStatus, subscribeToReminderSchedule, mobileNotifications, readReminderPreferences, ReminderPreferences, saveReminderPreferences } from "@/notifications/reminders";

const frequencies = [
  { minutes: 1, value: "1", unit: "minute" },
  { minutes: 120, value: "2", unit: "hours" },
  { minutes: 180, value: "3", unit: "hours" },
] as const;

export default function ReminderSettings() {
  const p = useSettingsPalette();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [busy, setBusy] = useState(mobileNotifications);
  const [scheduleStatus, setScheduleStatus] = useState(mobileNotifications ? "Checking scheduled reminders…" : "Reminders are available in the phone app.");
  useEffect(() => {
    if (!mobileNotifications) return;
    let active = true;
    const refreshStatus = () => {
      void getReminderScheduleStatus().then(status => { if (active) setScheduleStatus(status); })
        .catch(() => { if (active) setScheduleStatus("Could not check reminders. Re-select your frequency to try again."); });
    };
    const unsubscribe = subscribeToReminderSchedule(refreshStatus);
    const subscription = AppState.addEventListener("change", state => { if (state === "active") refreshStatus(); });
    refreshStatus();
    return () => { active = false; unsubscribe(); subscription.remove(); };
  }, []);
  useEffect(() => {
    if (!mobileNotifications) return;
    let active = true;
    readReminderPreferences().then(value => { if (active) setPreferences(value); })
      .catch(() => Alert.alert("Reminders", "Could not load reminder settings."))
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  const save = async (patch: Partial<ReminderPreferences>) => {
    if (busy) return;
    setBusy(true);
    const next = { ...preferences, ...patch };
    try { await saveReminderPreferences(next); setPreferences(next); }
    catch (error) { Alert.alert("Could not save reminders", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };
  const disabled = busy || !preferences.enabled || !mobileNotifications;
  const summary = scheduleStatus.replace(/Next task reminder: /g, 'Task: ').replace(/Next study reminder: /g, 'Study: ').replace(/\.\n/g, '  |  ').replace(/\.$/, '');
  const toggle = (label: string, value: boolean, locked: boolean, onPress: () => void, large = false) => (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled: locked }} disabled={locked} onPress={onPress}
      style={[styles.toggle, large && styles.largeToggle, { backgroundColor: value ? p.accent : p.dark ? '#56645C' : '#CCD5D0', opacity: locked ? 0.5 : 1, alignItems: value ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.thumb, large && styles.largeThumb]} />
    </Pressable>
  );
  return <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
    <View style={styles.header}>
      <View style={[styles.heroIcon, { backgroundColor: p.mint }]}><Feather name="bell" size={25} color={p.accent} /></View>
      <View style={styles.copy}><Text style={[styles.title, { color: p.text }]}>Reminders</Text><Text style={[styles.subtitle, { color: p.secondary }]}>Stay on track, effortlessly.</Text></View>
      {toggle('Enable reminders', preferences.enabled, busy || !mobileNotifications, () => void save({ enabled: !preferences.enabled }), true)}
    </View>
    <View style={[styles.group, { backgroundColor: p.inset }]}>
      {([
        ['tasks', 'check-circle', 'Due tasks', 'Get reminded about pending to-dos.'],
        ['study', 'book-open', 'Continue studying', 'Resume your topics after study gaps.'],
      ] as const).map(([key, icon, label, description], index) => <View key={key} style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.border }]}>
        <View style={[styles.smallIcon, { backgroundColor: p.mint }]}><Feather name={icon} size={22} color={p.accent} /></View>
        <View style={styles.copy}><Text style={[styles.label, { color: p.text }]}>{label}</Text><Text style={[styles.detail, { color: p.secondary }]}>{description}</Text></View>
        {toggle(label, preferences[key], disabled, () => void save({ [key]: !preferences[key] }))}
      </View>)}
    </View>
    <View style={styles.timing}>
      <Feather name="clock" size={21} color={p.text} />
      <Text style={[styles.timingLabel, { color: p.text }]}>Reminder timing</Text>
      <View style={styles.frequency}>{frequencies.map(({ minutes, value, unit }) => <Pressable key={minutes} accessibilityRole="radio" accessibilityLabel={`Every ${value} ${unit}`} accessibilityState={{ checked: preferences.intervalMinutes === minutes, disabled }} disabled={disabled} onPress={() => void save({ intervalMinutes: minutes })}
        style={[styles.option, { backgroundColor: preferences.intervalMinutes === minutes ? p.accent : p.inset, opacity: disabled ? 0.5 : 1 }]}>
        <Text style={[styles.frequencyText, { color: preferences.intervalMinutes === minutes ? p.card : p.secondary }]}>{value} {minutes === 1 ? 'min' : unit}</Text>
      </Pressable>)}</View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Next reminders, view schedule details" onPress={() => Alert.alert('Next reminders', scheduleStatus + '\n\nScheduled on your phone, even offline. Open Vault regularly to keep reminders going. Open an unfinished subject to start study reminders. Completed items stop; reminders may arrive overnight.')}
      style={[styles.schedule, { backgroundColor: p.inset }]}>
      <View style={[styles.calendar, { backgroundColor: p.mint }]}><Feather name="calendar" size={21} color={p.accent} /></View>
      <View style={styles.copy}><Text style={[styles.label, { color: p.text }]}>Next reminders</Text><Text numberOfLines={2} accessibilityLiveRegion="polite" style={[styles.detail, { color: p.secondary }]}>{summary}</Text></View>
      <Feather name="chevron-right" size={18} color={p.secondary} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: 18, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 11 },
  heroIcon: { width: 45, height: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 18, fontWeight: '600', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  group: { borderRadius: 13, paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 57, paddingVertical: 9, paddingHorizontal: 7 },
  smallIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: -0.3 },
  detail: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  toggle: { width: 40, height: 23, borderRadius: 14, padding: 2, justifyContent: 'center', flexShrink: 0 },
  largeToggle: { width: 52, height: 29, borderRadius: 18 },
  thumb: { width: 19, height: 19, borderRadius: 12, backgroundColor: '#FFFFFF' },
  largeThumb: { width: 25, height: 25, borderRadius: 14 },
  timing: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 11, flexWrap: 'wrap' },
  timingLabel: { fontSize: 12 },
  frequency: { flex: 1, minWidth: 185, flexDirection: 'row', gap: 5 },
  option: { flex: 1, minHeight: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  frequencyText: { fontSize: 12 },
  schedule: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 9, minHeight: 55 },
  calendar: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
