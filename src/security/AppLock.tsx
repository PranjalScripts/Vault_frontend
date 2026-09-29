import API from '@/api/client';
import { randomUUID } from 'expo-crypto';
import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { ActivityIndicator, AppState, Modal, Platform, Pressable, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import Feather from '@expo/vector-icons/Feather';
import { SettingsRow, SettingsSwitch } from '@/components/settings/SettingsPrimitives';
import { useSettingsPalette } from '@/hooks/use-settings-palette';
import { useTheme } from '@/hooks/use-theme';
import { observeScreenLock } from './screenLock';
import { createAppLockController } from './appLockController';

const KEY = 'vault-device-app-lock-v1';
const controller = createAppLockController({
  read: async () => {
    const value = await SecureStore.getItemAsync(KEY);
    if (value !== null && value !== 'enabled' && value !== 'disabled') throw Error('Invalid security setting');
    return value === 'enabled';
  },
  write: async (enabled: boolean) => SecureStore.setItemAsync(KEY, enabled ? 'enabled' : 'disabled', { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  available: async () => (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE,
  authenticate: async () => {
    const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Vault', promptSubtitle: 'Verify with your fingerprint or device lock',
    cancelLabel: 'Cancel', fallbackLabel: 'Use device passcode', disableDeviceFallback: false,
    biometricsSecurityLevel: 'strong', requireConfirmation: true,
    });
    // iOS can resolve the native prompt just before publishing its active event.
    if (result.success && AppState.currentState === 'inactive') {
      await new Promise<void>(resolve => {
        const finish = () => { clearTimeout(timer); subscription.remove(); resolve(); };
        const subscription = AppState.addEventListener('change', state => { if (state !== 'inactive') finish(); });
        const timer = setTimeout(finish, 1000);
      });
    }
    return result;
  },
});
const Context = createContext(controller);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  const theme = useTheme();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const stopScreenLock = observeScreenLock(controller.screenLocked);
    controller.foreground(AppState.currentState === 'active');
    void controller.initialize();
    const subscription = AppState.addEventListener('change', value => controller.foreground(value === 'active'));
    return () => { subscription.remove(); stopScreenLock(); };
  }, []);
  const covered = Platform.OS !== 'web' && (!state.ready || state.locked || (state.enabled && state.backgrounded));
  return <Context.Provider value={controller}>
    <View style={{ flex: 1 }} pointerEvents={covered ? 'none' : 'auto'} accessibilityElementsHidden={covered} importantForAccessibility={covered ? 'no-hide-descendants' : 'auto'}>{children}</View>
    <Modal visible={covered} animationType="none" presentationStyle="fullScreen" onRequestClose={() => {}} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: '100%', maxWidth: 360, alignItems: 'center', gap: 20 }}>
          <Feather name="shield" size={52} color={theme.accent} />
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700' }}>Vault is locked</Text>
          <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 23 }}>Use your fingerprint, Face ID, or phone’s device lock to continue.</Text>
          {state.busy || (!state.ready && !state.error) ? <ActivityIndicator color={theme.accent} /> : <Pressable accessibilityRole="button" onPress={() => void (state.ready ? controller.unlock() : controller.initialize())} style={{ minHeight: 52, width: '100%', backgroundColor: theme.accent, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{state.ready ? 'Unlock Vault' : 'Retry'}</Text></Pressable>}
          {!!state.error && <Text accessibilityRole="alert" style={{ color: theme.danger, textAlign: 'center', lineHeight: 21 }}>{state.error}</Text>}
        </View>
      </View>
    </Modal>
  </Context.Provider>;
}

export function AppLockSettings() {
  const lock = useContext(Context);
  const state = useSyncExternalStore(lock.subscribe, lock.snapshot, lock.snapshot);
  const p = useSettingsPalette();
  if (Platform.OS === 'web') return null;
  return <View style={{ gap: 8 }}>
    <SettingsRow title="Fingerprint & device lock" icon="finger-print-outline" compact
      description="Lock when your phone locks or after two minutes away. Brief app switches stay unlocked."
      trailing={<SettingsSwitch label="Fingerprint and device app lock" value={state.enabled} disabled={!state.ready || state.busy} onChange={value => {
        const before = lock.snapshot().enabled;
        void lock.setEnabled(value).then(async () => {
          if (before !== value && lock.snapshot().enabled === value) {
            try { await API.post('/notifications/device-security', { eventId: randomUUID(), appLockEnabled: value }); }
            catch { console.warn('Device security changed; its notification could not be saved.'); }
          }
        });
      }} />} />
    {!!state.error && <Text accessibilityRole="alert" style={{ color: p.danger, fontSize: 13, lineHeight: 19, paddingHorizontal: 8 }}>{state.error}</Text>}
  </View>;
}
