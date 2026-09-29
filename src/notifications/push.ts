import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import API from '@/api/client';
import { getAuthUser } from '@/api/auth';
import { loadNotifications } from './notificationModule';

const KEY = 'vault-remote-push-device';
const OPT_OUT = 'vault-remote-push-opt-out';
type Registration = { id: string; userId: string };
export async function pushRegistration(): Promise<Registration | null> {
  if (Platform.OS === 'web') return null;
  const raw = await SecureStore.getItemAsync(KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export async function disablePush(userInitiated = true) {
  if (userInitiated && Platform.OS !== 'web') {
    const user = await getAuthUser();
    const userId = String(user?._id || user?.id || '');
    if (userId) await SecureStore.setItemAsync(OPT_OUT, userId);
  }
  const registered = await pushRegistration();
  if (!registered) return;
  const config = { timeout: 10000, __reminderSync: true };
  await API.delete(`/notifications/devices/${registered.id}`, config);
  await SecureStore.deleteItemAsync(KEY);
}
export async function enablePush(requestPermission = true) {
  if (Platform.OS === 'web' || !Device.isDevice) throw new Error('Phone alerts need an installed Vault app on a physical device.');
  const Notifications = loadNotifications();
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('vault_automatic', {
    name: 'Automatic Vault reminders', importance: Notifications.AndroidImportance.DEFAULT,
  });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Allow notifications in your phone settings to receive alerts.');
  const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (Platform.OS !== 'android' && !projectId) throw new Error('This build needs its Expo project configured for phone alerts.');
  const user = await getAuthUser(), userId = String(user?._id || user?.id || '');
  if (!userId) throw new Error('Sign in to enable phone alerts.');
  const provider = Platform.OS === 'android' ? 'fcm' : 'expo';
  const token = Platform.OS === 'android'
    ? (await Notifications.getDevicePushTokenAsync()).data
    : (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const previous = await pushRegistration();
  const current = await getAuthUser();
  if (String(current?._id || current?.id || '') !== userId) return;
  const response = await API.post('/notifications/devices', { token, platform: Platform.OS, provider, ...(Constants.expoConfig?.version ? { appVersion: Constants.expoConfig.version } : {}), previousDeviceId: previous?.userId === userId ? previous.id : undefined }, { timeout: 10000 });
  const latest = await getAuthUser();
  if (String(latest?._id || latest?.id || '') !== userId) return;
  await SecureStore.setItemAsync(KEY, JSON.stringify({ id: response.data.data.id, userId }));
  await SecureStore.deleteItemAsync(OPT_OUT);
}
let refreshing: Promise<void> | null = null;
export function refreshPushRegistration(): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = refreshRegistration().finally(() => { refreshing = null; });
  return refreshing;
}
async function refreshRegistration() {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const user = await getAuthUser();
  const userId = String(user?._id || user?.id || '');
  if (!userId || await SecureStore.getItemAsync(OPT_OUT) === userId) return;
  const saved = await pushRegistration();
  if (saved && saved.userId !== userId) {
    // Changing accounts requires explicit opt-in before transferring a token.
    await SecureStore.deleteItemAsync(KEY);
    await SecureStore.setItemAsync(OPT_OUT, userId);
    return;
  }
  const permission = await loadNotifications().getPermissionsAsync();
  if (!permission.granted) {
    if (saved) await disablePush(false);
    return;
  }
  // Repair missing registrations after login/reinstall when OS permission is already granted.
  await enablePush(false);
}
