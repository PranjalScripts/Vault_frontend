const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const loader = require('./helpers/loadTypeScript.cjs');
function setup(available = true) {
  let version = 0, screen, app, locks = 0, removals = 0;
  const native = { getLockVersion: () => version, addListener: (_, fn) => { screen = fn; return { remove: () => removals++ }; } };
  const { observeScreenLock } = loader(path.join(__dirname, '../src/security'), {
    expo: { requireOptionalNativeModule: () => available ? native : null },
    'react-native': { Platform: { OS: 'android' }, AppState: { addEventListener: (_, fn) => { app = fn; return { remove: () => removals++ }; } } },
  })('screenLock');
  const stop = observeScreenLock(() => locks++);
  return { stop, change: state => app(state), screen: () => { version++; screen?.(); }, suspendedScreen: () => version++, locks: () => locks, removals: () => removals };
}
test('native counter catches screen-off while JS is suspended and avoids duplicate lock events', () => {
  const monitor = setup();
  monitor.change('background'); monitor.change('active'); assert.equal(monitor.locks(), 0);
  monitor.screen(); assert.equal(monitor.locks(), 1);
  monitor.change('active'); assert.equal(monitor.locks(), 1);
  monitor.suspendedScreen(); monitor.change('active'); assert.equal(monitor.locks(), 2);
  monitor.stop(); assert.equal(monitor.removals(), 2);
});
test('older binaries without the screen signal fail closed on background', () => {
  const monitor = setup(false);
  monitor.change('background'); monitor.change('active'); assert.equal(monitor.locks(), 1);
  monitor.stop(); assert.equal(monitor.removals(), 1);
});
