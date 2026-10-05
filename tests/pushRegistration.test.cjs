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

function setupWeb(permission = 'default', saved = null) {
  const oldGlobals = new Map();
  const setGlobal = (key, value) => {
    oldGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  const storage = new Map();
  if (saved) storage.set('vault-web-push-device', JSON.stringify(saved));
  const calls = [], browserCalls = [];
  const notification = {
    permission,
    requestPermission: async () => { browserCalls.push('requestPermission'); notification.permission = 'granted'; return 'granted'; },
  };
  const subscription = { endpoint: 'https://push.example/sub', keys: { p256dh: 'key', auth: 'auth' } };
  const workerRegistration = { pushManager: {
    getSubscription: async () => null,
    subscribe: async options => { browserCalls.push({ subscribe: true, hasApplicationKey: !!options.applicationServerKey }); return subscription; },
  } };
  const serviceWorker = { register: async path => { browserCalls.push({ register: path }); return workerRegistration; }, ready: Promise.resolve(), getRegistration: async () => workerRegistration };
  setGlobal('window', { Notification: notification, PushManager: function PushManager() {}, isSecureContext: true });
  setGlobal('navigator', { serviceWorker });
  setGlobal('Notification', notification);
  setGlobal('PushManager', function PushManager() {});
  setGlobal('localStorage', { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) });
  setGlobal('atob', value => Buffer.from(value, 'base64').toString('binary'));
  const api = loader(path.join(__dirname, '../src/notifications'), {
    'react-native': { Platform: { OS: 'web' } },
    'expo-device': { isDevice: false }, 'expo-constants': { default: { expoConfig: {} } },
    'expo-secure-store': { getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} },
    '@/api/auth': { getAuthUser: async () => ({ id: 'owner' }) },
    '@/api/client': { default: {
      get: async () => ({ data: { data: { webPushConfigured: true, webPushPublicKey: 'AQ'.repeat(42) } } }),
      post: async (url, data) => { calls.push({ url, data }); return { data: { data: { id: 'a'.repeat(24) } } }; },
      delete: async () => {},
    } },
    './notificationModule': { loadNotifications: () => ({}) },
  })('push');
  return { api, calls, browserCalls, storage, cleanup: () => {
    for (const [key, descriptor] of oldGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  } };
}
test('web opt-in requests browser permission from the explicit action and registers a VAPID subscription', async t => {
  const { api, calls, browserCalls, storage, cleanup } = setupWeb(); t.after(cleanup);
  await api.enablePushForPlatform();
  assert.equal(browserCalls[0], 'requestPermission');
  assert.deepEqual(browserCalls.find(call => typeof call === 'object' && call.register), { register: '/push-sw.js' });
  assert.equal(calls[0].data.provider, 'webpush');
  assert.equal(calls[0].data.platform, 'web');
  assert.equal(JSON.parse(calls[0].data.token).endpoint, 'https://push.example/sub');
  assert.equal(JSON.parse(storage.get('vault-web-push-device')).userId, 'owner');
});
test('web test push targets the registered browser instead of another signed-in device', async t => {
  const { api, calls, cleanup } = setupWeb('granted', { id: 'b'.repeat(24), userId: 'owner' }); t.after(cleanup);
  await api.sendPushTest();
  assert.deepEqual(calls[0], { url: '/notifications/push-test', data: { deviceId: 'b'.repeat(24) } });
});
