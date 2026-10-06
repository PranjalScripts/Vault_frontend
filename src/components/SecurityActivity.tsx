import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import API, { forceRefresh } from '@/api/client';
import { logout } from '@/api/auth';
import { refreshPushRegistration } from '@/notifications/push';
import { useSettingsPalette } from '@/hooks/use-settings-palette';

type DeviceSession = { id: string; deviceLabel: string; platform: string; createdAt: string; current: boolean };

export default function SecurityActivity() {
  const p = useSettingsPalette();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [confirmingSession, setConfirmingSession] = useState('');
  const [endingSession, setEndingSession] = useState('');
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setSessionError(''); setSessions([]);
    void (async () => {
      try {
        const activeSessions = await forceRefresh('/auth/sessions');
        if (!active) return;
        setSessions(activeSessions.data.data);
      } catch { if (active) setSessionError('Could not load signed-in devices. Please retry.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry]));
  const endSession = async (session: DeviceSession) => {
    if (endingSession) return;
    setEndingSession(session.id); setSessionError('');
    try {
      if (session.current) {
        await logout();
        router.replace('/');
        return;
      }
      await API.delete(`/auth/sessions/${session.id}`);
      setSessions(current => current.filter(item => item.id !== session.id));
      setConfirmingSession('');
    } catch {
      setSessionError(`Could not sign out ${session.deviceLabel}. Please retry.`);
    } finally { setEndingSession(''); }
  };
  return <View style={{ padding: 16, borderWidth: 1, borderColor: p.border, borderRadius: 18, backgroundColor: p.card, gap: 14 }}>
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Feather name="shield" size={23} color={p.accent} />
      <Text accessibilityRole="header" style={{ color: p.text, fontSize: 18, fontWeight: '700', flex: 1 }}>Signed-in devices</Text>
    </View>
    <Text style={{ color: p.secondary, fontSize: 13, lineHeight: 19 }}>Review signed-in devices and sign out any session you no longer use.</Text>
    <View style={{ gap: 10, padding: 12, borderRadius: 12, backgroundColor: p.inset }}>
      {!!sessionError && <Text accessibilityRole="alert" style={{ color: p.text }}>{sessionError}</Text>}
      {loading && <ActivityIndicator color={p.accent} />}
      {!!sessionError && !loading && <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={{ paddingVertical: 8 }}><Text style={{ color: p.accent }}>Try again</Text></Pressable>}
      {!loading && !sessions.length && !sessionError && <Text style={{ color: p.secondary, lineHeight: 20 }}>No active devices found.</Text>}
      {sessions.map(session => <View key={session.id} style={{ padding: 11, borderRadius: 10, backgroundColor: p.card, gap: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name={session.platform === 'web' ? 'monitor' : 'smartphone'} size={17} color={p.accent} />
          <Text style={{ color: p.text, fontWeight: '600', flex: 1 }}>{session.deviceLabel || session.platform || 'Unknown device'}</Text>
          {session.current && <Text style={{ color: p.accent, fontSize: 11, fontWeight: '700' }}>THIS DEVICE</Text>}
        </View>
        <Text style={{ color: p.secondary, fontSize: 12 }}>Signed in {new Date(session.createdAt).toLocaleString()}</Text>
        {confirmingSession === session.id ? <View style={{ gap: 8 }}>
          <Text style={{ color: p.secondary, fontSize: 12, lineHeight: 18 }}>Sign out this device? It will lose access to Vault immediately.</Text>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Pressable accessibilityRole="button" disabled={!!endingSession} onPress={() => void endSession(session)} style={{ paddingVertical: 8, opacity: endingSession ? .55 : 1 }}>
              <Text style={{ color: p.danger, fontWeight: '700' }}>{endingSession === session.id ? 'Signing out…' : 'Confirm sign out'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={!!endingSession} onPress={() => setConfirmingSession('')} style={{ paddingVertical: 8 }}><Text style={{ color: p.accent }}>Cancel</Text></Pressable>
          </View>
        </View> : <Pressable accessibilityRole="button" accessibilityLabel={`Sign out ${session.deviceLabel}`} disabled={!!endingSession} onPress={() => setConfirmingSession(session.id)} style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
          <Text style={{ color: p.danger, fontWeight: '600' }}>Sign out device</Text>
        </Pressable>}
      </View>)}
    </View>
  </View>;
}
