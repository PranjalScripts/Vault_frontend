const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function compile(file, imports = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src/notifications', file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('exports', 'require', output)(exports, name => {
    if (!(name in imports)) throw new Error(`Unexpected dependency ${name}`);
    return imports[name];
  });
  return exports;
}
test('SecureStore snapshot chunks preserve large Unicode values within small native entries', async () => {
  const values = new Map();
  const secure = {
    getItemAsync: async key => values.get(key) ?? null,
    setItemAsync: async (key, value) => { assert.ok(Buffer.byteLength(value, 'utf8') < 2048); values.set(key, value); },
    deleteItemAsync: async key => values.delete(key),
  };
  const snapshots = compile('snapshotStore.ts', { 'expo-secure-store': secure });
  const value = JSON.stringify({ title: '📚 पढ़ाई 漢字'.repeat(1500) });
  await snapshots.writeSnapshotValue('test', value);
  assert.equal(await snapshots.readSnapshotValue('test'), value);
  await snapshots.writeSnapshotValue('test', 'small');
  assert.equal(await snapshots.readSnapshotValue('test'), 'small');
  assert.equal(values.size, 2);
});

test('an interrupted SecureStore write leaves the previous snapshot readable', async () => {
  const values = new Map(); let fail = false;
  const secure = {
    getItemAsync: async key => values.get(key) ?? null,
    setItemAsync: async (key, value) => { if (fail && key === 'test-1-1') throw new Error('disk full'); values.set(key, value); },
    deleteItemAsync: async key => values.delete(key),
  };
  const snapshots = compile('snapshotStore.ts', { 'expo-secure-store': secure });
  await snapshots.writeSnapshotValue('test', 'original');
  fail = true;
  await assert.rejects(snapshots.writeSnapshotValue('test', 'x'.repeat(2000)), /disk full/);
  assert.equal(await snapshots.readSnapshotValue('test'), 'original');
});

test('notification loader supports named and default-wrapped Metro exports', () => {
  const api = { getAllScheduledNotificationsAsync() {}, cancelScheduledNotificationAsync() {}, scheduleNotificationAsync() {} };
  for (const exports of [api, { default: api }]) {
    const loader = compile('notificationModule.ts', { 'expo-notifications': exports });
    assert.equal(loader.loadNotifications(), api);
  }
});

test('notification loader reports missing APIs before any undefined function call', () => {
  const loader = compile('notificationModule.ts', { 'expo-notifications': {} });
  assert.throws(() => loader.loadNotifications(), /Local notification APIs are unavailable/);
});

test('notification cleanup failure cannot block logout or retain credentials', async () => {
  const values = new Map([['vault-auth-token', 'token'], ['vault-auth-user', '{"id":"owner"}']]);
  const source = fs.readFileSync(path.join(__dirname, '../src/api/auth.js'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const api = { defaults: { headers: { common: { Authorization: 'Bearer token' } } }, interceptors: { response: { use() {} } } };
  let cacheCleared = false;
  const imports = {
    'react-native': { Platform: { OS: 'android' } },
    'expo-secure-store': { deleteItemAsync: async key => values.delete(key) },
    './client': { default: api, clearApiCache: () => { cacheCleared = true; } },
    '@/notifications/reminders': { clearLocalReminders: async () => { throw new TypeError('native API missing'); } },
  };
  const auth = {};
  new Function('exports', 'require', 'console', output)(auth, name => imports[name], { warn() {}, error() {} });
  let authenticated = true;
  auth.subscribeToAuthChanges(value => { authenticated = value; });
  await auth.logout();
  assert.equal(values.size, 0);
  assert.equal(api.defaults.headers.common.Authorization, undefined);
  assert.equal(cacheCleared, true);
  assert.equal(authenticated, false);
});


function migration(platform = 'android', native = true) {
  const calls = { cancelled: [], dismissed: [], cleared: 0, activities: [] };
  let response = { notification: { request: { identifier: 'remote-push-1' } } };
  const service = compile('reminders.ts', {
    'react-native': { Platform: { OS: platform } },
    'expo': { requireOptionalNativeModule: () => native ? {} : null },
    './activity': { recordReminderActivity: async activity => calls.activities.push(activity) },
    './notificationModule': { loadNotifications: () => ({
      getAllScheduledNotificationsAsync: async () => [{ identifier: 'vault-local-task-1' }, { identifier: 'other-app-schedule' }],
      getPresentedNotificationsAsync: async () => [{ request: { identifier: 'vault-local-study-1' } }, { request: { identifier: 'remote-push-1' } }],
      cancelScheduledNotificationAsync: async id => calls.cancelled.push(id),
      dismissNotificationAsync: async id => calls.dismissed.push(id),
      getLastNotificationResponse: () => response,
      clearLastNotificationResponse: () => { calls.cleared++; },
    }) },
  });
  return { service, calls, setResponse: value => { response = value; } };
}
test('migration cancels legacy schedules without destroying a remote cold-start tap', async () => {
  const h = migration();
  await h.service.clearLocalReminders();
  assert.deepEqual(h.calls.cancelled, ['vault-local-task-1']);
  assert.deepEqual(h.calls.dismissed, ['vault-local-study-1']);
  assert.equal(h.calls.cleared, 0);
  h.setResponse({ notification: { request: { identifier: 'vault-local-task-1' } } });
  await h.service.clearLocalReminders(); assert.equal(h.calls.cleared, 1);
});
test('web and older binaries do not call missing native notification APIs', async () => {
  for (const h of [migration('web'), migration('android', false)]) {
    await h.service.clearLocalReminders(); assert.equal(h.calls.cancelled.length, 0);
  }
});
test('study activity is reported on web and mobile without scheduling local alerts', () => {
  for (const platform of ['web', 'android']) {
    const h = migration(platform);
    h.service.recordSubjectStudyVisit({ _id: 'subject' });
    h.service.recordStudyActivity('subject', 'topic', 'Private subject', 'Private topic');
    assert.deepEqual(h.calls.activities, [{ kind: 'study', subjectId: 'subject' }, { kind: 'study', subjectId: 'subject', topicId: 'topic' }]);
    assert.equal(h.calls.cancelled.length, 0);
  }
});
function pushHarness({ granted = true, platform = 'android', stored = null, apiFailure = false } = {}) {
  const calls = { requests: 0, registered: [], removed: [], channel: [] };
  const values = new Map(stored ? [['vault-remote-push-device', JSON.stringify(stored)]] : []);
  const service = compile('push.ts', {
    'react-native': { Platform: { OS: platform } }, 'expo-device': { isDevice: true },
    'expo-constants': { default: { easConfig: { projectId: 'project' } } },
    'expo-secure-store': { getItemAsync: async key => values.get(key) || null, setItemAsync: async (key, value) => values.set(key, value), deleteItemAsync: async key => values.delete(key) },
    '@/api/auth': { getAuthUser: async () => ({ id: 'owner' }) },
    '@/api/client': { default: {
      post: async (url, body) => { calls.registered.push(body); return { data: { data: { id: 'device' } } }; },
      delete: async (url, config) => { calls.removed.push({ url, config }); if (apiFailure) throw Error('offline'); },
    } },
    './notificationModule': { loadNotifications: () => ({
      AndroidImportance: { DEFAULT: 3 }, setNotificationChannelAsync: async id => calls.channel.push(id),
      getPermissionsAsync: async () => ({ granted }), requestPermissionsAsync: async () => { calls.requests++; return { granted }; },
      getDevicePushTokenAsync: async () => ({ data: 'native_fcm_token_for_test' }),
      getExpoPushTokenAsync: async () => ({ data: 'ExpoPushToken[test]' }),
    }) },
  });
  return { service, calls, values };
}
test('permission denial never registers a phone and never affects the inbox', async () => {
  const h = pushHarness({ granted: false }); await assert.rejects(h.service.enablePush(), /Allow notifications/);
  assert.equal(h.calls.registered.length, 0); assert.equal(h.calls.requests, 1);
});
test('push registration persists only the device reference and refresh never prompts', async () => {
  const h = pushHarness(); await h.service.enablePush(); await h.service.refreshPushRegistration();
  assert.deepEqual(await h.service.pushRegistration(), { id: 'device', userId: 'owner' });
  assert.equal(h.calls.requests, 0); assert.equal(h.calls.registered.length, 2);
  assert.equal(h.calls.registered[0].provider, 'fcm');
  assert.equal(h.calls.registered[0].token, 'native_fcm_token_for_test');
  assert.equal(h.calls.registered[1].previousDeviceId, 'device');
  assert.ok(h.calls.channel.includes('vault_automatic'));
  assert.ok(!JSON.stringify([...h.values.values()]).includes('ExpoPushToken'));
});
test('logout deregistration avoids recursive authentication failure and retains retry info offline', async () => {
  const h = pushHarness({ stored: { id: 'device', userId: 'owner' }, apiFailure: true });
  await assert.rejects(h.service.disablePush(), /offline/);
  assert.ok(await h.service.pushRegistration());
  assert.equal(h.calls.removed[0].config.__reminderSync, true);
});
test('notification deep links cannot navigate to external sites or arbitrary app routes', () => {
  const { safeNotificationRoute } = compile('routes.ts');
  const id = '507f1f77bcf86cd799439011';
  for (const route of ['/todos', `/subjects/${id}?resumeTopicId=${id}`, `/interview/question/${id}`, '/games/path', '/puzzles']) assert.equal(safeNotificationRoute(route), route);
  for (const route of ['https://evil.example', '//evil.example', '/passcodes', '/browser?url=https://evil.example', '/todos?redirect=https://evil.example', '/games/../../passcodes']) assert.equal(safeNotificationRoute(route), '/notifications');
});

test('rapid game completion is sent in order and is not suppressed by the idle heartbeat', async () => {
  const states = []; let release;
  const first = new Promise(resolve => { release = resolve; });
  const activity = compile('activity.ts', {
    react: {}, 'react-native': {},
    '@/api/auth': { getAuthUser: async () => ({ id: 'owner' }), getAuthToken: async () => 'token', subscribeToAuthChanges() {} },
    '@/api/client': { default: { post: async (_url, value) => { states.push(value.unfinished); if (states.length === 1) await first; } } },
  });
  const idle = activity.recordReminderActivity({ kind: 'game', key: 'path', unfinished: false });
  await new Promise(resolve => setImmediate(resolve));
  const start = activity.recordReminderActivity({ kind: 'game', key: 'path', unfinished: true });
  const finish = activity.recordReminderActivity({ kind: 'game', key: 'path', unfinished: false });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(states, [false]);
  release();
  await Promise.all([idle, start, finish]);
  assert.deepEqual(states, [false, true, false]);
  await activity.recordReminderActivity({ kind: 'game', key: 'path', unfinished: false });
  assert.deepEqual(states, [false, true, false]);
});

test('OTP validation errors preserve the signed-in session and reach the form', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/api/auth.js'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  let rejectResponse, deletions = 0;
  const api = { defaults: { headers: { common: { Authorization: 'Bearer session' } } }, interceptors: { response: { use(_success, reject) { rejectResponse = reject; } } } };
  const imports = {
    'react-native': { Platform: { OS: 'android' } },
    'expo-secure-store': { deleteItemAsync: async () => { deletions++; } },
    './client': { default: api, clearApiCache() {} },
  };
  new Function('exports', 'require', output)({}, name => imports[name]);
  const error = { response: { status: 400, data: { message: 'Incorrect or expired OTP. Please try again or request a new code.' } }, config: { headers: { Authorization: 'Bearer session' } } };
  await assert.rejects(rejectResponse(error), actual => actual === error);
  assert.equal(deletions, 0);
  assert.equal(api.defaults.headers.common.Authorization, 'Bearer session');
});
