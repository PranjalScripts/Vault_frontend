import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { forceRefresh } from '@/api/client';
import { AppLayout } from '@/components/AppLayout';
import { useTheme } from '@/hooks/use-theme';
export default function UpdatesScreen() {
  const theme = useTheme(), router = useRouter();
  const [release, setRelease] = useState<{ version: string; url: string } | null>(null), [message, setMessage] = useState('Checking for updates…');
  const load = () => { setMessage('Checking for updates…'); void forceRefresh('/notifications/app-update').then(response => { setRelease(response.data.data); setMessage(response.data.data ? '' : 'No update has been announced.'); }).catch(() => setMessage('Could not check for updates. Please retry.')); };
  useEffect(load, []);
  return <AppLayout mobileTitle="Vault updates" mobileBackAction={() => router.back()}><View style={{ padding: 20, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 26 }}>Vault updates</Text>
    <Text style={{ color: theme.textSecondary }}>Installed version: {Constants.expoConfig?.version || 'Unknown'}</Text>
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
    {release && <><Text style={{ color: theme.text }}>Latest version: {release.version}</Text><Pressable accessibilityRole="link" onPress={() => { if (/^https:\/\//.test(release.url)) void Linking.openURL(release.url).catch(() => setMessage('Could not open the download page.')); }} style={{ padding: 16, borderRadius: 12, backgroundColor: theme.accentMuted }}><Text style={{ color: theme.accent }}>Open update page</Text></Pressable></>}
    <Pressable accessibilityRole="button" onPress={load} style={{ padding: 12 }}><Text style={{ color: theme.accent }}>Check again</Text></Pressable>
  </View></AppLayout>;
}
