const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
function compile(file, imports) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {}; new Function('exports', 'require', output)(exports, name => { if (!(name in imports)) throw Error(name); return imports[name]; }); return exports;
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const notificationId = '507f1f77bcf86cd799439011';
const response = (identifier = 'push', userId = 'owner') => ({ notification: { request: { identifier, content: { data: { kind: 'inbox', userId, notificationId } } } } });
async function observer({ cold = null, route = '/todos', get } = {}) {
  let user = { id: 'owner' }, cleanup, listener, handler, removed = 0;
  const navigated = [], read = [];
  const notifications = {
    setNotificationHandler: value => { handler = value; }, clearLastNotificationResponse() {},
    addPushTokenListener: () => ({ remove() { removed++; } }), addNotificationReceivedListener: () => ({ remove() { removed++; } }),
    addNotificationResponseReceivedListener: value => { listener = value; return { remove() { removed++; } }; }, getLastNotificationResponse: () => cold,
  };
  const { safeNotificationRoute } = compile('notifications/routes.ts', {});
  const component = compile('components/NotificationObserver.tsx', {
    react: { useEffect: fn => { cleanup = fn(); } }, 'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-router': { useRouter: () => ({ push: value => navigated.push(value) }) }, '@/api/auth': { getAuthUser: async () => user },
    '@/api/client': { default: { patch: async url => read.push(url) }, forceRefresh: get || (async () => ({ data: { data: { route } } })) },
    '@/notifications/routes': { safeNotificationRoute }, '@/notifications/reminders': { notificationsAvailable: true, clearLocalReminders: async () => {} },
    '@/notifications/inbox': { useNotificationInbox: () => ({ refresh: async () => {} }) }, '@/notifications/push': { refreshPushRegistration: async () => {} },
    '@/notifications/notificationModule': { loadNotifications: () => notifications },
  }).default;
  component({ ready: true }); await tick();
  return { navigated, read, changeOwner: id => { user = { id }; }, tap: async value => { listener(value); await tick(); }, foreground: value => handler.handleNotification(value.notification), close: () => cleanup(), removed: () => removed };
}
test('cold-start and background FCM taps open the owned item and mark it read once', async () => {
  const h = await observer({ cold: response(), route: `/subjects/${notificationId}?resumeTopicId=${notificationId}` });
  assert.deepEqual(h.navigated, [`/subjects/${notificationId}?resumeTopicId=${notificationId}`]);
  assert.equal(h.read.length, 1); await h.tap(response()); assert.equal(h.read.length, 1);
  await h.tap(response('background')); assert.equal(h.read.length, 2);
  assert.equal((await h.foreground(response('foreground'))).shouldShowBanner, true);
  assert.equal((await h.foreground(response('foreign', 'other'))).shouldShowBanner, false);
  h.close(); assert.equal(h.removed(), 3);
});
test('another account cannot open a push and an in-flight tap cannot navigate after account switch', async () => {
  let resolve; const h = await observer({ get: () => new Promise(r => { resolve = r; }) });
  await h.tap(response('foreign', 'other')); assert.equal(h.navigated.length, 0);
  await h.tap(response('pending')); h.changeOwner('other'); resolve({ data: { data: { route: '/todos' } } }); await tick();
  assert.equal(h.navigated.length, 0); assert.equal(h.read.length, 0); h.close();
});
test('offline, deleted and unsafe destinations fall back to the inbox', async () => {
  for (const config of [{ get: async () => { throw Error('offline'); } }, { route: 'https://example.invalid/private' }]) {
    const h = await observer(config); await h.tap(response()); assert.deepEqual(h.navigated, ['/notifications']); h.close();
  }
});
test('new destinations are allowlisted precisely', () => {
  const { safeNotificationRoute } = compile('notifications/routes.ts', {});
  for (const route of ['/updates', '/subjects', '/settings?section=security']) assert.equal(safeNotificationRoute(route), route);
  for (const route of ['/settings?section=security&redirect=https://evil.invalid', '//evil.invalid', '/updates?url=https://evil.invalid']) assert.equal(safeNotificationRoute(route), '/notifications');
});
test('loading an already completed game does not establish a streak', async () => {
  const ref = { current: undefined }, saved = [];
  const activity = compile('notifications/activity.ts', {
    react: { useRef: () => ref, useEffect: fn => fn() }, 'react-native': {},
    '@/api/auth': { getAuthUser: async () => ({ id: 'owner' }), getAuthToken: async () => 'token', subscribeToAuthChanges() {} },
    '@/api/client': { default: { post: async (_url, body) => saved.push(body) } },
  });
  activity.useGameCompletion('path', false, false); activity.useGameCompletion('path', true, true); await tick(); assert.equal(saved.length, 0);
  activity.useGameCompletion('path', false, true); activity.useGameCompletion('path', true, true); await tick();
  assert.deepEqual(saved, [{ kind: 'game', key: 'path', unfinished: false, completed: true }]);
});
