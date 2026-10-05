import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppLayout } from '@/components/AppLayout';
import { GameBack, useGameTheme } from '@/features/games/GameUI';
import { enablePushForPlatform, listenForWebPush, pushRegistration, sendPushTest, webPushRegistration } from '@/notifications/push';
import { loadNotifications } from '@/notifications/notificationModule';

type Permission = 'checking' | 'default' | 'granted' | 'denied' | 'unsupported';

export default function PushTestScreen() {
  const theme = useGameTheme(), router = useRouter();
  const [permission, setPermission] = useState<Permission>('checking');
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const web = Platform.OS === 'web';

  const refresh = useCallback(async () => {
    if (web) {
      if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPermission('unsupported'); setRegistered(false); return;
      }
      const [registration, allowed] = await Promise.all([
        webPushRegistration(), Promise.resolve(Notification.permission),
      ]);
      setPermission(allowed); setRegistered(!!registration);
      return;
    }
    try {
      const [result, registration] = await Promise.all([
        loadNotifications().getPermissionsAsync(), pushRegistration(),
      ]);
      setPermission(result.granted ? 'granted' : 'default'); setRegistered(!!registration);
    } catch {
      setPermission('unsupported'); setRegistered(false);
    }
  }, [web]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!web) return;
    return listenForWebPush(payload => setMessage(`Browser received: ${payload.title || 'Vault notification'} — ${payload.body || 'Push arrived.'}`));
  }, [web]);

  const enable = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      // This is called directly from the button press so browsers can show their permission prompt.
      await enablePushForPlatform();
      await refresh();
      setMessage(web ? 'Browser alerts are enabled on this browser.' : 'Phone alerts are enabled on this device.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not enable notifications.');
      await refresh();
    } finally { setBusy(false); }
  };

  const sendTest = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      if (!registered || permission !== 'granted') throw new Error('Enable notifications on this device first.');
      await sendPushTest();
      setMessage(web ? 'Push sent. A browser notification should appear; this page will also confirm delivery.' : 'The push provider accepted the test. Check this device’s notification tray.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not send the test notification.');
    } finally { setBusy(false); }
  };

  const label = web ? 'Browser push test' : 'App push test';
  const permissionText = permission === 'checking' ? 'Checking permission…'
    : permission === 'granted' ? 'Permission is already allowed. The browser will not show the prompt again.'
      : permission === 'denied' ? 'Notifications are blocked for this site. Allow them in the browser’s site settings, then reload.'
        : permission === 'unsupported' ? 'This browser or app build does not support remote notifications.'
          : web ? 'Permission has not been requested yet. Select Enable to show the browser prompt.'
            : 'Phone permission has not been granted yet.';

  return <AppLayout mobileTitle={label} title={label} themeOverride={theme}>
    <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, gap: 16 }}>
      <GameBack backLabel="Back to Notifications" onPress={() => router.replace('/settings?section=notifications' as never)} />
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 22 }}>{permissionText}</Text>
      {web && typeof window !== 'undefined' && !window.isSecureContext && <Text style={{ color: theme.danger }}>Browser push requires HTTPS or localhost.</Text>}
      <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Registration: {registered ? 'active on this device' : 'not registered'}</Text>
      <Pressable accessibilityRole="button" disabled={busy || permission === 'unsupported'} onPress={() => void enable()} style={{ minHeight: 50, padding: 14, borderRadius: 14, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', opacity: busy ? .6 : 1 }}>
        <Text style={{ color: theme.background, fontWeight: '700' }}>{busy ? 'Working…' : web ? 'Enable browser alerts' : 'Enable phone alerts'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy || !registered || permission !== 'granted'} onPress={() => void sendTest()} style={{ minHeight: 50, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', opacity: busy || !registered ? .5 : 1 }}>
        <Text style={{ color: theme.accent, fontWeight: '700' }}>{busy ? 'Sending…' : 'Send test notification'}</Text>
      </Pressable>
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.accent }}>{message}</Text>}
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text>}
    </View>
  </AppLayout>;
}
