const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const loader = require('./helpers/loadTypeScript.cjs');
test('both game hooks mount and clean up on native when window exists without DOM methods', () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(global, 'window');
  const documentDescriptor = Object.getOwnPropertyDescriptor(global, 'document');
  Object.defineProperty(global, 'window', { value: {}, configurable: true });
  Object.defineProperty(global, 'document', { value: {}, configurable: true });
  const effects = [], cleanups = []; let subscriptions = 0;
  const mocks = {
    react: { useCallback: fn => fn, useRef: value => ({ current: value }), useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useEffect: fn => effects.push(fn) },
    'react-native': { Platform: { OS: 'android' }, AppState: { currentState: 'active', addEventListener: () => { subscriptions++; return { remove: () => subscriptions-- }; } } },
    'expo-router': { useFocusEffect: () => {} },
    'expo-crypto': { randomUUID: () => 'test-id' },
    '@/api/api': { getAuthUser: () => new Promise(() => {}) },
    'react-native-reanimated': { useSharedValue: value => ({ value }), withTiming: value => value, withSequence: (...values) => values.at(-1) },
    './feedback': { ClashFeedback: class { prepare() { return Promise.resolve(); } configure() {} stop() {} dispose() {} } },
    '@/notifications/snapshotStore': { readSnapshotValue: async () => null, writeSnapshotValue: async () => {} },
  };
  try {
    for (const feature of ['tapClash/useTapClash', 'path/state/usePathGame']) {
      const load = loader(path.join(__dirname, '../src/features'), mocks);
      const hook = Object.values(load(feature))[0]; hook();
    }
    assert.doesNotThrow(() => { for (const effect of effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } });
    assert.equal(subscriptions, 2);
    assert.doesNotThrow(() => { for (const cleanup of cleanups.reverse()) cleanup(); });
    assert.equal(subscriptions, 0);
  } finally {
    for (const cleanup of cleanups) { try { cleanup(); } catch {} }
    if (windowDescriptor) Object.defineProperty(global, 'window', windowDescriptor); else delete global.window;
    if (documentDescriptor) Object.defineProperty(global, 'document', documentDescriptor); else delete global.document;
  }
});
