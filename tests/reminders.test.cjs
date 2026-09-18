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
const planner = compile('planner.ts');
const now = Date.parse('2026-09-16T10:00:00Z');
const prefs = { enabled: true, tasks: true, study: true, intervalMinutes: 180 };
const task = { _id: 'task1', title: 'Read chapter', dueDate: '2026-09-16T12:00:00Z' };
const study = { subjectId: 'subject1', topicId: 'topic1', subjectName: 'Physics', topicTitle: 'Gravity', lastStudiedAt: now };
const plan = (snapshot, preferences = prefs, time = now) => planner.planReminders(snapshot, preferences, 'owner', time);

test('future tasks start at due time and repeat at the selected interval', () => {
  for (const minutes of [1, 120, 180]) {
    const items = plan({ tasks: [task], study: null }, { ...prefs, intervalMinutes: minutes });
    assert.equal(items[0].at, Date.parse(task.dueDate));
    assert.equal(items[1].at - items[0].at, minutes * 60000);
    assert.equal(items[0].data.itemId, task._id);
    assert.equal(items[0].data.userId, 'owner');
  }
});
test('completion, deletion, invalid dates and disabled categories remove reminders', () => {
  const tasks = [{ ...task, isCompleted: true }, { ...task, deletedAt: 'date' }, { ...task, dueDate: 'bad' }, { ...task, dueDate: null }];
  assert.deepEqual(plan({ tasks, study: null }), []);
  assert.deepEqual(plan({ tasks: [task], study }, { ...prefs, enabled: false }), []);
  assert.deepEqual(plan({ tasks: [task], study }, { ...prefs, tasks: false, study: false }), []);
});
test('multiple due tasks are grouped without mentioning future tasks too early', () => {
  const later = { ...task, _id: 'task2', title: 'Later task', dueDate: '2026-09-16T15:00:00Z' };
  const items = plan({ tasks: [task, later], study: null });
  assert.equal(items[0].title, 'Task due'); assert.ok(!items[0].body.includes('Later task'));
  assert.equal(items[1].title, '2 tasks are due'); assert.equal(items[1].data.itemId, undefined);
});
test('reopening the app preserves the cadence and schedules no past dates', () => {
  const first = plan({ tasks: [task], study });
  const later = plan({ tasks: [task], study }, prefs, now + 3600000);
  assert.deepEqual(first, later);
  const overdue = plan({ tasks: [task], study }, prefs, now + 6 * 3600000);
  assert.ok(overdue.every(item => item.at > now + 6 * 3600000));
});
test('study starts after one interval and retains daily follow-ups for long absences', () => {
  const items = plan({ tasks: [], study });
  assert.equal(items[0].at, now + 3 * 3600000);
  assert.equal(items[0].data.topicId, 'topic1');
  assert.ok(items.every(item => item.at <= now + 7 * 86400000));
  const afterAbsence = plan({ tasks: [], study }, prefs, now + 8 * 86400000);
  assert.equal(afterAbsence.length, 7);
  assert.equal(afterAbsence[0].at, now + 9 * 86400000);
  assert.match(afterAbsence[0].body, /9 days/);
});
test('new study activity resets the timer and both categories share a bounded queue', () => {
  const items = plan({ tasks: [task], study }, { ...prefs, intervalMinutes: 120 });
  assert.equal(items.length, 60);
  assert.ok(items.some(item => item.data.kind === 'task'));
  assert.ok(items.some(item => item.data.kind === 'study'));
  assert.equal(new Set(items.map(item => item.id)).size, 60);
  const recent = { ...study, lastStudiedAt: now + 3600000 };
  assert.equal(plan({ tasks: [], study: recent }, prefs, recent.lastStudiedAt)[0].at, recent.lastStudiedAt + 3 * 3600000);
});

function harness({ platform = 'android', granted = true, offline = false, nativeNotifications = true, apiTasks = [], existingChannel = null } = {}) {
  const store = new Map([['vault-auth-token', 'token'], ['vault-reminders-owner', JSON.stringify(prefs)]]);
  const scheduled = new Map(); const calls = { network: 0, canceled: 0, scheduled: 0, permissions: 0, channels: [] };
  const notifications = {
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { NONE: 0, DEFAULT: 3, HIGH: 4 }, AndroidNotificationVisibility: { PRIVATE: 0 }, IosAuthorizationStatus: { PROVISIONAL: 3 },
    getPermissionsAsync: async () => ({ granted, canAskAgain: false }),
    requestPermissionsAsync: async () => { calls.permissions++; return { granted }; },
    getNotificationChannelAsync: async () => existingChannel,
    setNotificationChannelAsync: async (id, config) => { calls.channels.push({ id, ...config }); existingChannel = config; },
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    cancelScheduledNotificationAsync: async id => { calls.canceled++; scheduled.delete(id); },
    scheduleNotificationAsync: async item => { calls.scheduled++; scheduled.set(item.identifier, item); return item.identifier; },
    dismissAllNotificationsAsync: async () => {}, clearLastNotificationResponse: () => {},
  };
  const storage = { getItem: async key => store.get(key) || null, setItem: async (key, value) => store.set(key, value) };
  const api = { get: async () => { calls.network++; if (offline) throw new Error('offline'); return { data: { data: apiTasks, pagination: { hasNextPage: false } } }; } };
  const secure = { getItemAsync: storage.getItem, setItemAsync: storage.setItem, deleteItemAsync: async key => store.delete(key) };
  const snapshots = compile('snapshotStore.ts', { 'expo-secure-store': secure });
  const service = compile('reminders.ts', {
    'react-native': { Platform: { OS: platform } },
    'expo': { requireOptionalNativeModule: () => nativeNotifications ? {} : null },
    './snapshotStore': snapshots,
    './notificationModule': compile('notificationModule.ts', { 'expo-notifications': notifications }),
    'expo-secure-store': secure,
    '@/api/client': { default: api }, '@/api/auth': { getAuthUser: async () => ({ id: 'owner' }) },
    './planner': planner, 'expo-notifications': notifications,
  });
  const capture = (data, url = '/todos/task1', method = 'put', token = 'token') => service.captureReminderData({
    config: { url, method, headers: { Authorization: `Bearer ${token}` } }, data: { data },
  });
  return { service, store, scheduled, calls, capture };
}
test('a task edit schedules OS dates; completing it cancels them without a notification server', async () => {
  const h = harness();
  await h.capture({ ...task, dueDate: new Date(Date.now() + 3600000).toISOString() });
  assert.equal(h.scheduled.size, 60); assert.equal(h.calls.network, 0);
  for (const item of h.scheduled.values()) assert.equal(item.trigger.type, 'date');
  await h.capture({ ...task, isCompleted: true });
  assert.equal(h.scheduled.size, 0);
});
test('identical responses do not duplicate scheduled notifications', async () => {
  const h = harness(); const future = { ...task, dueDate: new Date(Date.now() + 3600000).toISOString() };
  await h.capture(future); await h.capture(future);
  assert.equal(h.calls.scheduled, 60); assert.equal(h.calls.canceled, 0);
});
test('offline refresh preserves and refills persisted reminders; sign-out cancels offline', async () => {
  const h = harness({ offline: true });
  await h.capture({ ...task, dueDate: new Date(Date.now() + 3600000).toISOString() });
  await h.service.refreshLocalReminders();
  assert.equal(h.scheduled.size, 60);
  const before = h.calls.network;
  await h.service.clearLocalReminders();
  assert.equal(h.scheduled.size, 0); assert.equal(h.calls.network, before);
});
test('denied notification permission schedules nothing and returns a useful error', async () => {
  const h = harness({ granted: false });
  await assert.rejects(h.service.saveReminderPreferences(prefs), /Allow notifications/);
  assert.equal(h.scheduled.size, 0); assert.equal(h.calls.network, 0);
});
test('web never asks for permission or schedules reminders', async () => {
  const h = harness({ platform: 'web' });
  await h.service.saveReminderPreferences(prefs); await h.capture(task); await h.service.refreshLocalReminders();
  assert.equal(h.calls.permissions, 0); assert.equal(h.scheduled.size, 0); assert.equal(h.calls.network, 0);
});
test('stale responses from a different account cannot schedule alerts', async () => {
  const h = harness(); await h.capture(task, '/todos/task1', 'put', 'another-token');
  assert.equal(h.scheduled.size, 0);
});
test('deleting a topic or completing it cancels local study notifications', async () => {
  const h = harness();
  h.store.set('vault-reminder-data-owner', JSON.stringify({ tasks: [], study: { ...study, lastStudiedAt: Date.now() } }));
  await h.service.saveReminderPreferences(prefs);
  assert.ok(h.scheduled.size > 0);
  await h.capture({ _id: 'subject1', subjectName: 'Physics', topics: [{ _id: 'topic1', topic: 'Gravity', status: 'completed' }] }, '/subjects/subject1/topics/topic1');
  assert.equal(h.scheduled.size, 0);
});

test('an older app binary can load and sign out without the notifications native module', async () => {
  const h = harness({ nativeNotifications: false });
  assert.equal(h.service.notificationsAvailable, false);
  await h.service.clearLocalReminders();
  await assert.rejects(h.service.saveReminderPreferences(prefs), /Rebuild and reinstall/);
  assert.equal(h.calls.scheduled, 0);
});

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


test('one-minute study reminders start after sixty seconds and stay within the queue budget', () => {
  const items = plan({ tasks: [], study }, { ...prefs, intervalMinutes: 1 });
  assert.equal(items[0].at, now + 60000);
  assert.equal(items[1].at - items[0].at, 60000);
  assert.equal(items.length, 60);
});

test('stored hour-based preferences migrate and the one-minute option persists', async () => {
  const h = harness();
  for (const [hours, expected] of [[2, 120], [3, 180]]) {
    h.store.set('vault-reminders-owner', JSON.stringify({ enabled: true, tasks: true, study: true, intervalHours: hours }));
    assert.equal((await h.service.readReminderPreferences()).intervalMinutes, expected);
  }
  await h.service.saveReminderPreferences({ ...prefs, intervalMinutes: 1 });
  assert.equal((await h.service.readReminderPreferences()).intervalMinutes, 1);
});

test('empty schedules explain eligibility instead of claiming reminders are queued', async () => {
  const h = harness();
  assert.match(await h.service.getReminderScheduleStatus(), /Nothing scheduled yet/);
  await h.service.saveReminderPreferences({ ...prefs, tasks: false });
  assert.match(await h.service.getReminderScheduleStatus(), /unfinished subject or topic/);
});

test('selecting one minute refreshes a missing snapshot and schedules an overdue task', async () => {
  const due = { ...task, dueDate: new Date(Date.now() - 3600000).toISOString() };
  const h = harness({ apiTasks: [due] });
  await h.service.saveReminderPreferences({ ...prefs, study: false, intervalMinutes: 1 });
  assert.equal(h.calls.network, 1);
  assert.equal(h.scheduled.size, 60);
  const earliest = Math.min(...[...h.scheduled.values()].map(item => item.trigger.date.getTime()));
  assert.ok(earliest > Date.now());
  assert.ok(earliest <= Date.now() + 61000);
  assert.match(await h.service.getReminderScheduleStatus(), /Next task reminder:/);
});

test('schedule status reports blocked permission and never implies delivery is enabled', async () => {
  const h = harness({ granted: false });
  assert.match(await h.service.getReminderScheduleStatus(), /Notifications are blocked/);
});

test('Android channel starts high with native sound and vibration and is initialized only once', async () => {
  const h = harness();
  const future = { ...task, dueDate: new Date(Date.now() + 3600000).toISOString() };
  await h.capture(future); await h.capture(future);
  assert.deepEqual(h.calls.channels, [{ id: 'vault_reminders', name: 'Task and study reminders', importance: 4, sound: 'default', enableVibrate: true, vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: 0, bypassDnd: false }]);
  for (const item of h.scheduled.values()) {
    assert.equal(item.trigger.channelId, 'vault_reminders');
    assert.equal(item.content.autoDismiss, true);
    assert.equal(item.content.sticky, false);
    assert.equal(item.content.data.presentation, 'vault-native-v1');
  }
});
test('existing user-disabled reminder channel is never recreated or overridden', async () => {
  const h = harness({ existingChannel: { importance: 0, sound: null, enableVibrate: false } });
  assert.match(await h.service.getReminderScheduleStatus(), /channel is blocked/);
  assert.equal(h.calls.channels.length, 0);
});

test('existing plain notification requests migrate once to the native presentation channel', async () => {
  const h = harness();
  const future = { ...task, dueDate: new Date(Date.now() + 3600000).toISOString() };
  await h.capture(future);
  for (const request of h.scheduled.values()) {
    delete request.content.data.presentation;
    request.trigger.channelId = 'reminders';
  }
  await h.capture(future);
  assert.equal(h.calls.canceled, 60);
  assert.equal(h.calls.scheduled, 120);
  await h.capture(future);
  assert.equal(h.calls.scheduled, 120);
  assert.ok([...h.scheduled.values()].every(request => request.trigger.channelId === 'vault_reminders'));
});

test('short queues reserve hour and day study reminders alongside due tasks', () => {
  const items = plan({ tasks: [{ ...task, dueDate: new Date(now - 60000).toISOString() }], study }, { ...prefs, intervalMinutes: 1 });
  assert.equal(items.length, 60);
  assert.equal(new Set(items.map(item => item.id)).size, 60);
  const studies = items.filter(item => item.data.kind === 'study');
  assert.ok(studies.some(item => item.at === now + 60000));
  assert.ok(studies.some(item => item.at === now + 3 * 3600000 && item.body.includes('3 hours')));
  for (let day = 1; day <= 7; day++) assert.ok(studies.some(item => item.at === now + day * 86400000));
  assert.ok(studies.filter(item => item.at >= now + 86400000).every((item, index, daily) => !index || item.at - daily[index - 1].at === 86400000));
});
test('opening an unfinished subject starts native study reminders without needing resource links', async () => {
  const h = harness();
  await h.service.recordSubjectStudyVisit({ _id: 'subject1', subjectName: 'Physics', topics: [
    { _id: 'done', topic: 'Finished', status: 'completed' },
    { _id: 'pending', topic: 'Next', status: 'pending' },
    { _id: 'current', topic: 'Gravity', status: 'in_progress' },
  ] });
  assert.ok(h.scheduled.size > 0);
  assert.ok([...h.scheduled.values()].every(item => item.content.data.topicId === 'current'));
  assert.match(await h.service.getReminderScheduleStatus(), /Next study reminder:/);
});
test('subject revisit preserves the last unfinished topic and resets inactivity timing', async () => {
  const h = harness();
  h.store.set('vault-reminder-data-owner', JSON.stringify({ tasks: [], study: { ...study, lastStudiedAt: Date.now() - 3 * 86400000 } }));
  await h.service.recordSubjectStudyVisit({ _id: study.subjectId, subjectName: study.subjectName, topics: [
    { _id: 'another', topic: 'Another topic', status: 'in_progress' },
    { _id: study.topicId, topic: study.topicTitle, status: 'pending' },
  ] });
  const requests = [...h.scheduled.values()];
  assert.ok(requests.length > 0);
  assert.ok(requests.every(item => item.content.data.topicId === study.topicId));
  const first = requests.sort((a,b) => a.trigger.date - b.trigger.date)[0];
  assert.ok(first.trigger.date.getTime() >= Date.now() + 3 * 3600000 - 2000);
  assert.ok(!first.content.body.includes('days'));
});
test('fully completed subjects cannot start study reminders', async () => {
  const h = harness();
  await h.service.recordSubjectStudyVisit({ _id: 'subject1', subjectName: 'Physics', topics: [{ _id: 'done', topic: 'Finished', isCompleted: true }] });
  assert.equal(h.scheduled.size, 0);
});
test('task schedules do not conceal missing study activity in settings', async () => {
  const h = harness();
  await h.capture({ ...task, dueDate: new Date(Date.now() + 3600000).toISOString() });
  const status = await h.service.getReminderScheduleStatus();
  assert.match(status, /Next task reminder:/);
  assert.match(status, /Study: open an unfinished subject or topic/);
});
