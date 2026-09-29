const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const loader = require('./helpers/loadTypeScript.cjs');
const KEY = 'vault-remote-push-device', OPT_OUT = 'vault-remote-push-opt-out';
function setup({ granted = true, saved = null, optOut = null } = {}) {
  const store = new Map(), calls = [];
  if (saved) store.set(KEY, JSON.stringify(saved));
  if (optOut) store.set(OPT_OUT, optOut);
  const notifications = {
    AndroidImportance: { DEFAULT: 3 }, setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => ({ granted }),
    requestPermissionsAsync: async () => { throw Error('Background refresh must never prompt'); },
    getDevicePushTokenAsync: async () => ({ data: 'test-token' }),
  };
  const api = loader(path.join(__dirname, '../src/notifications'), {
    'react-native': { Platform: { OS: 'android' } },
    'expo-device': { isDevice: true }, 'expo-constants': { default: { expoConfig: { version: '1.0.0' } } },
    'expo-secure-store': { getItemAsync: async key => store.get(key) || null, setItemAsync: async (key, value) => store.set(key, value), deleteItemAsync: async key => store.delete(key) },
    '@/api/auth': { getAuthUser: async () => ({ id: 'owner' }) },
    '@/api/client': { default: { post: async (url, data) => { calls.push({ url, data }); return { data: { data: { id: 'device' } } }; }, delete: async () => {} } },
    './notificationModule': { loadNotifications: () => notifications },
  })('push');
  return { api, store, calls };
}
test('granted OS permission repairs a missing registration and overlapping refreshes coalesce', async () => {
  const { api, store, calls } = setup();
  await Promise.all([api.refreshPushRegistration(), api.refreshPushRegistration()]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].data.provider, 'fcm');
  assert.equal(JSON.parse(store.get(KEY)).userId, 'owner');
});
test('explicit phone-alert opt-out survives automatic refresh', async () => {
  const { api, store, calls } = setup({ saved: { id: 'device', userId: 'owner' } });
  await api.disablePush(); await api.refreshPushRegistration();
  assert.equal(calls.length, 0); assert.equal(store.get(OPT_OUT), 'owner');
});
test('logout deregistration permits registration at the next login', async () => {
  const { api, calls } = setup({ saved: { id: 'device', userId: 'owner' } });
  await api.disablePush(false); await api.refreshPushRegistration();
  assert.equal(calls.length, 1);
});
test('permission denial never registers or prompts during background refresh', async () => {
  const { api, calls } = setup({ granted: false });
  await api.refreshPushRegistration(); assert.equal(calls.length, 0);
});
test('account change requires explicit opt-in before transferring token ownership', async () => {
  const { api, calls } = setup({ saved: { id: 'device', userId: 'someone-else' } });
  await api.refreshPushRegistration(); await api.refreshPushRegistration();
  assert.equal(calls.length, 0);
  await api.enablePush(false); assert.equal(calls.length, 1);
});
