import { useRef, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useSettingsPalette } from '@/hooks/use-settings-palette';
import { setThemePreference, useThemePreference } from '@/state/theme-preference';
import { useFeedbackModal } from '@/contexts/FeedbackModalContext';
import { logout } from '@/api/api';
import { AppLockSettings } from '@/security/AppLock';
import { ChangeVaultPassword } from '@/components/ChangeVaultPassword';
import ReminderSettings from '@/components/ReminderSettings';
import SecurityActivity from '@/components/SecurityActivity';
import { SettingsRow } from './SettingsPrimitives';

const pages = {
  home: { title: 'Settings', subtitle: 'Make Vault work the way you want.' },
  security: { title: 'Security', subtitle: 'Keep your data safe.' },
  notifications: { title: 'Notifications', subtitle: 'Stay on track, everywhere.' },
  appearance: { title: 'Appearance', subtitle: 'Choose your theme and visual style.' },
  devices: { title: 'Devices & login activity', subtitle: 'Manage active sessions and recognize every sign-in.' },
  lock: { title: 'App lock', subtitle: 'A little extra peace of mind.' },
} as const;
type Page = keyof typeof pages;
const choices = [{ value: 'light', title: 'Light', icon: 'sun' }, { value: 'dark', title: 'Dark', icon: 'moon' }, { value: 'system', title: 'System', icon: 'monitor' }] as const;

export default function MobileSettings() {
  const p = useSettingsPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const page: Page = section && Object.hasOwn(pages, section) ? section as Page : 'home';
  const { title, subtitle } = pages[page];
  const preference = useThemePreference();
  const { showError } = useFeedbackModal();
  const [themeError, setThemeError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const signingOutRef = useRef(false);
  const open = (next: Page) => router.push({ pathname: '/settings', params: { section: next } });
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace(page === 'home' ? '/dashboard' : '/settings');
  };
  const signOut = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true; setSigningOut(true);
    try { await logout(); router.replace('/'); }
    catch { showError({ title: 'Could not sign out', message: 'Please try signing out again.' }); }
    finally { signingOutRef.current = false; setSigningOut(false); }
  };
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: p.background }]}>
    <StatusBar style={p.dark ? 'light' : 'dark'} />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={styles.back} hitSlop={4}>
        <Feather name="arrow-left" size={26} color={p.text} />
      </Pressable>
      <View style={{ flex: 1, gap: 3 }}><Text accessibilityRole="header" style={[styles.heading, { color: p.text }]}>{title}</Text><Text style={[styles.subtitle, { color: p.secondary }]}>{subtitle}</Text></View>
    </View>
    <ScrollView key={page} style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
      {page === 'home' && <>
        <ImageBackground source={require('@/assets/images/settings-mountain-vault.png')} resizeMode="cover" style={[styles.banner, { borderColor: p.dark ? '#2A5140' : '#9DBFAD' }]} imageStyle={{ borderRadius: 19 }} accessibilityIgnoresInvertColors>
          <View style={styles.bannerCopy}><Text style={styles.bannerTitle}>Your space.{"\n"}Your rules.</Text><Text style={styles.bannerDescription}>Customize, secure and{"\n"}stay productive.</Text></View>
        </ImageBackground>
        <SettingsRow title="Fingerprint & device lock" description="Lock when your phone locks or after two minutes away. Brief app switches stay unlocked." icon="finger-print-outline" onPress={() => open('lock')} />
        <SettingsRow title="Notifications" description="Reminders across all your devices." icon="notifications-outline" tone="red" onPress={() => open('notifications')} />
        <SettingsRow title="Security" description="Change vault password, review device activity and more." icon="shield-checkmark-outline" onPress={() => open('security')} />
        <SettingsRow title="Appearance" description="Choose your theme and visual style." icon="color-palette-outline" tone="purple" onPress={() => open('appearance')} />
      </>}
      {page === 'security' && <>
        <AppLockSettings />
        <ChangeVaultPassword renderTrigger={(onPress, disabled) => <SettingsRow compact title="Change vault password" description="Update the password used to unlock your passcodes." icon="key-outline" onPress={onPress} disabled={disabled} />} />
        <SettingsRow compact title="Signed-in devices" description="Review devices signed in to Vault and sign out any session you no longer use." icon="phone-portrait-outline" tone="neutral" onPress={() => open('devices')}
          footer={<Text style={{ color: p.accent, fontSize: 13, marginTop: 2 }}>Manage signed-in devices</Text>} />
        <View style={[styles.divider, { backgroundColor: p.border }]} />
        <SettingsRow compact borderless danger title={signingOut ? 'Logging out…' : 'Logout'} description="Sign out from your account." icon="log-out-outline" tone="red" disabled={signingOut} onPress={() => void signOut()} />
      </>}
      {page === 'notifications' && <ReminderSettings mobile />}
      {page === 'appearance' && <>
        <View accessibilityRole="radiogroup" accessibilityLabel="App appearance" style={[styles.appearance, { backgroundColor: p.card, borderColor: p.border }]}>
          {choices.map(choice => {
            const selected = preference === choice.value;
            return <Pressable key={choice.value} accessibilityRole="radio" accessibilityLabel={`${choice.title} theme`} accessibilityState={{ checked: selected }}
              onPress={() => { setThemeError(''); void setThemePreference(choice.value).catch(() => setThemeError('Theme applied, but could not be saved. Please try again.')); }}
              style={({ pressed }) => [styles.themeTile, { backgroundColor: selected ? p.mint : p.inset, borderColor: selected ? p.accent : 'transparent', opacity: pressed ? 0.8 : 1 }]}>
              {selected && <View style={[styles.check, { backgroundColor: p.accent }]}><Feather name="check" size={12} color={p.dark ? '#073025' : '#FFFFFF'} /></View>}
              <Feather name={choice.icon} size={30} color={p.text} />
              <Text style={{ color: p.text, fontSize: 14, fontWeight: '500' }}>{choice.title}</Text>
            </Pressable>;
          })}
        </View>
        {!!themeError && <Text accessibilityRole="alert" style={{ color: p.danger, paddingHorizontal: 4 }}>{themeError}</Text>}
      </>}
      {page === 'devices' && <SecurityActivity />}
      {page === 'lock' && <>
        <AppLockSettings />
        <View style={[styles.explanation, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={{ color: p.text, fontSize: 16, fontWeight: '600' }}>Protection that gives you a moment</Text>
          <Text style={[styles.explanationText, { color: p.secondary }]}>Switch apps briefly without unlocking Vault again. After two minutes away, or when your phone reports that it has locked, you’ll need to authenticate.</Text>
          <Text style={[styles.explanationText, { color: p.secondary }]}>Your vault password still protects your saved passcodes. App lock applies only to this phone.</Text>
        </View>
      </>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { width: '100%', maxWidth: 600, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 22 },
  back: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '600', letterSpacing: -0.65 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 16, gap: 12 },
  banner: { width: '100%', aspectRatio: 1.88, minHeight: 180, borderRadius: 20, overflow: 'hidden', borderWidth: 1, justifyContent: 'center', marginBottom: 3, backgroundColor: '#092019' },
  bannerCopy: { paddingHorizontal: 22, width: '65%', gap: 8 },
  bannerTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 31, letterSpacing: -0.7, fontWeight: '700' },
  bannerDescription: { color: '#F0F7F3', fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginHorizontal: 5, marginTop: 10, marginBottom: 0 },
  appearance: { flexDirection: 'row', padding: 10, gap: 8, borderWidth: 1, borderRadius: 19 },
  themeTile: { flex: 1, minHeight: 104, borderWidth: 1, borderRadius: 14, gap: 12, alignItems: 'center', justifyContent: 'center', paddingTop: 9 },
  check: { position: 'absolute', top: 8, right: 8, width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  explanation: { padding: 20, borderWidth: 1, borderRadius: 18, gap: 12 },
  explanationText: { fontSize: 13, lineHeight: 21 },
});
