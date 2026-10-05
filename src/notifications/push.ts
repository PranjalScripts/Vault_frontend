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
  if (Platform.OS === 'web') return disableWebPush();
  if (userInitiated) {
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
const webKey = 'vault-web-push-device';
function decodeVapidKey(value: string) {
  const padded = value + '='.repeat((4 - value.length % 4) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}
export async function webPushRegistration(): Promise<Registration | null> {
  try {
    const raw = localStorage.getItem(webKey), parsed = raw ? JSON.parse(raw) : null;
    return parsed && /^[a-f\d]{24}$/i.test(parsed.id) && typeof parsed.userId === 'string' ? parsed : null;
  } catch { return null; }
}
async function disableWebPush() {
  const registered = await webPushRegistration();
  const worker = await navigator.serviceWorker?.getRegistration('/');
  const subscription = await worker?.pushManager.getSubscription();
  await subscription?.unsubscribe();
  if (registered) await API.delete(`/notifications/devices/${registered.id}`, { timeout: 10000 });
  localStorage.removeItem(webKey);
}
export async function webPushPermissionGranted() {
  if (Platform.OS !== 'web' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
}
export function listenForWebPush(listener: (payload: { title?: string; body?: string }) => void) {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return () => {};
  const handler = (event: MessageEvent) => { if (event.data?.kind === 'vault-push') listener(event.data.payload || {}); };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
async function enableWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error('This browser does not support web push.');
  if (Notification.permission === 'denied') throw new Error('Notifications are blocked for this site. Allow them in your browser’s site settings, then try again.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Allow notifications in your browser settings.');
  const user = await getAuthUser(), userId = String(user?._id || user?.id || '');
  if (!userId) throw new Error('Sign in to enable web push.');
  const existing = await webPushRegistration();
  const status = await API.get('/notifications/push-status', { timeout: 10000 });
  const publicKey = status.data.data.webPushPublicKey;
  if (!status.data.data.webPushConfigured || !publicKey) throw new Error('Web push is not configured on the server yet.');
  const registration = await navigator.serviceWorker.register('/push-sw.js');
  await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(publicKey) });
  const response = await API.post('/notifications/devices', { token: JSON.stringify(subscription), platform: 'web', provider: 'webpush' }, { timeout: 10000 });
  if (existing?.id && existing.id !== response.data.data.id) void API.delete(`/notifications/devices/${existing.id}`).catch(() => {});
  localStorage.setItem(webKey, JSON.stringify({ id: response.data.data.id, userId }));
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
export async function sendPushTest() {
  if (Platform.OS === 'web') {
    let registration = await webPushRegistration();
    const user = await getAuthUser();
    const userId = String(user?._id || user?.id || '');
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Allow notifications in your browser settings, then try again.');
    }
    if (!registration || registration.userId !== userId || !/^[a-f\d]{24}$/i.test(registration.id)) {
      await enableWebPush();
      registration = await webPushRegistration();
    }
    if (!registration || registration.userId !== userId) throw new Error('Browser notifications are not registered yet. Enable them and try again.');
    await API.post('/notifications/push-test', { deviceId: registration.id }, { timeout: 15000 }); return;
  }
  const registered = await pushRegistration();
  const user = await getAuthUser(), userId = String(user?._id || user?.id || '');
  if (!registered || registered.userId !== userId) throw new Error('Enable phone alerts on this device first.');
  await API.post('/notifications/push-test', { deviceId: registered.id }, { timeout: 15000 });
}
let refreshing: Promise<void> | null = null;
export function refreshPushRegistration(): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = refreshRegistration().finally(() => { refreshing = null; });
  return refreshing;
}
async function refreshRegistration() {
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return;
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
export async function enablePushForPlatform() {
  if (Platform.OS === 'web') return enableWebPush();
  return enablePush();
}
