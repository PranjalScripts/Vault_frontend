import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { forceRefresh } from '@/api/client';
import { useSettingsPalette } from '@/hooks/use-settings-palette';

type SecurityEvent = {
  _id: string; title: string; body: string; createdAt: string;
  data?: { alertCode?: string; deviceLabel?: string; loginAt?: string };
};

export default function SecurityActivity() {
  const p = useSettingsPalette();
  const { notificationId } = useLocalSearchParams<{ notificationId?: string }>();
  const [items, setItems] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(''); setItems([]);
    void (async () => {
      try {
        const [recent, selected] = await Promise.all([
          forceRefresh('/notifications/security-activity'),
          notificationId && /^[a-f\d]{24}$/i.test(notificationId)
            ? forceRefresh(`/notifications/${notificationId}`).catch(() => null) : null,
        ]);
        if (!active) return;
        const rows: SecurityEvent[] = recent.data.data;
        const highlighted = selected?.data.data;
        setItems(highlighted?.category === 'security'
          ? [highlighted, ...rows.filter(row => row._id !== highlighted._id)] : rows);
      } catch { if (active) setError('Could not load security activity. Please retry.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  // Retry deliberately reruns the focused request even when the selected notification is unchanged.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationId, retry]));
  return <View style={{ padding: 16, borderWidth: 1, borderColor: p.border, borderRadius: 18, backgroundColor: p.card, gap: 14 }}>
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Feather name="shield" size={23} color={p.accent} />
      <Text accessibilityRole="header" style={{ color: p.text, fontSize: 18, fontWeight: '700', flex: 1 }}>Devices &amp; login activity</Text>
    </View>
    <Text style={{ color: p.secondary, fontSize: 13, lineHeight: 19 }}>Recent sign-ins and security changes. Device information is reported by the signing-in device; this is not a list of active sessions.</Text>
    {loading ? <ActivityIndicator color={p.accent} /> : error ? <View style={{ gap: 8 }}>
      <Text accessibilityRole="alert" style={{ color: p.text }}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={{ paddingVertical: 12 }}><Text style={{ color: p.accent }}>Try again</Text></Pressable>
    </View> : items.length ? items.map(item => <View key={item._id} style={{ gap: 6, padding: 12, borderRadius: 12, backgroundColor: item._id === notificationId ? p.mint : p.inset }}>
      {item._id === notificationId && <Text style={{ color: p.accent, fontWeight: '600' }}>Selected notification</Text>}
      <Text style={{ color: p.text, fontSize: 15, fontWeight: '600' }}>{item.title}</Text>
      {!!item.data?.deviceLabel && <Text style={{ color: p.text }}>Device: {item.data.deviceLabel}</Text>}
      <Text style={{ color: p.secondary, lineHeight: 20 }}>{item.body}</Text>
      <Text style={{ color: p.secondary, fontSize: 12 }}>{new Date(item.data?.loginAt || item.createdAt).toLocaleString()}</Text>
    </View>) : <Text style={{ color: p.secondary }}>No recent security activity.</Text>}
  </View>;
}
