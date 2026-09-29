import API from '@/api/client';
import { randomUUID } from 'expo-crypto';
import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { ActivityIndicator, AppState, Modal, Platform, Pressable, Switch, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '@/hooks/use-theme';
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
    controller.foreground(AppState.currentState === 'active');
    void controller.initialize();
    const subscription = AppState.addEventListener('change', value => controller.foreground(value === 'active'));
    return () => subscription.remove();
  }, []);
  const covered = Platform.OS !== 'web' && (!state.ready || state.locked);
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
  const theme = useTheme();
  if (Platform.OS === 'web') return null;
  return <View style={{ backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Feather name="shield" size={25} color={theme.accent} />
      <View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 17, fontWeight: '600' }}>Fingerprint & device lock</Text><Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 }}>Require phone authentication when opening or returning to Vault.</Text></View>
      <Switch accessibilityLabel="Fingerprint and device app lock" value={state.enabled} disabled={!state.ready || state.busy} onValueChange={value => {
        const before = lock.snapshot().enabled;
        void lock.setEnabled(value).then(async () => {
          if (before !== value && lock.snapshot().enabled === value) {
            try { await API.post('/notifications/device-security', { eventId: randomUUID(), appLockEnabled: value }); }
            catch { console.warn('Device security changed; its notification could not be saved.'); }
          }
        });
      }} trackColor={{ true: theme.accent }} />
    </View>
    <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>Applies to this phone. Your vault password is still required to unlock saved passcodes.</Text>
    {!!state.error && <Text accessibilityRole="alert" style={{ color: theme.danger, fontSize: 13 }}>{state.error}</Text>}
  </View>;
}
