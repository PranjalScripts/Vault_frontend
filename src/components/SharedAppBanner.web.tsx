import { useEffect, useState } from 'react';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { androidAppIntent } from '@/utils/appLinks';

export default function SharedAppBanner() {
  const pathname = usePathname();
  const { token } = useGlobalSearchParams<{ token?: string }>();
  const theme = useTheme();
  const [intent, setIntent] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(false);
    setIntent(/Android/i.test(navigator.userAgent) ? androidAppIntent(window.location.href) : null);
  }, [pathname, token]);
  if (!intent || dismissed) return null;
  const download = process.env.EXPO_PUBLIC_ANDROID_DOWNLOAD_URL || '/downloads/vault.apk';
  return <View style={{ padding: 12, gap: 8, backgroundColor: theme.backgroundElement, borderBottomWidth: 1, borderColor: theme.border }}>
    <Text style={{ color: theme.text, fontWeight: '700' }}>Open this shared item in Vault</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      <a href={intent} style={{ color: theme.accent, padding: '10px 0' }}>Open in app</a>
      <a href={download} style={{ color: theme.accent, padding: '10px 0' }}>Download Android app</a>
      <Pressable accessibilityRole="button" onPress={() => setDismissed(true)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: theme.textSecondary }}>Continue in browser</Text>
      </Pressable>
    </View>
  </View>;
}
