const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exportsObject = {};
new Function('exports', ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/security/appLockController.js'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exportsObject);
const { createAppLockController } = exportsObject;
function setup(overrides = {}) {
  const writes = [];
  const lock = createAppLockController({ read: async () => true, write: async value => writes.push(value), available: async () => true, authenticate: async () => ({ success: true }), ...overrides });
  return { lock, writes };
}
test('cold starts lock but brief app switches preserve a verified unlock', async () => {
  let time = 0;
  const { lock } = setup({ now: () => time });
  await lock.initialize(); assert.equal(lock.snapshot().locked, true);
  await lock.unlock(); assert.equal(lock.snapshot().locked, false);
  lock.foreground(false); assert.equal(lock.snapshot().backgrounded, true);
  time = 119999;
  lock.foreground(true); assert.equal(lock.snapshot().locked, false);
  assert.equal(lock.snapshot().backgrounded, false);
});
test('two minutes away locks even when JS timers were suspended', async () => {
  let time = 0;
  const { lock } = setup({ now: () => time });
  await lock.initialize(); await lock.unlock();
  lock.foreground(false); time = 60000; lock.foreground(false);
  time = 120000; lock.foreground(true);
  assert.equal(lock.snapshot().locked, true);
});
test('screen locking cancels grace and late authentication cannot override it', async () => {
  let resolve;
  const { lock } = setup({ authenticate: () => new Promise(done => { resolve = done; }) });
  await lock.initialize();
  const attempt = lock.unlock(); await Promise.resolve();
  lock.screenLocked(); resolve({ success: true }); await attempt;
  assert.equal(lock.snapshot().locked, true);
});
test('screen-off locks a previously unlocked app during a brief switch', async () => {
  const { lock } = setup();
  await lock.initialize(); await lock.unlock();
  lock.foreground(false); lock.screenLocked(); lock.foreground(true);
  assert.equal(lock.snapshot().locked, true);
});
test('cancelled authentication keeps the app locked and does not disable the setting', async () => {
  const { lock, writes } = setup({ authenticate: async () => ({ success: false, error: 'user_cancel' }) });
  await lock.initialize(); await lock.unlock(); await lock.setEnabled(false);
  assert.equal(lock.snapshot().locked, true); assert.equal(lock.snapshot().enabled, true);
  assert.equal(writes.length, 0); assert.match(lock.snapshot().error, /not completed/);
});
test('missing screen lock cannot enable security', async () => {
  const { lock, writes } = setup({ read: async () => false, available: async () => false });
  await lock.initialize(); await lock.setEnabled(true);
  assert.equal(lock.snapshot().enabled, false); assert.equal(writes.length, 0);
  assert.match(lock.snapshot().error, /phone settings/);
});
test('enable and disable both require successful OS authentication before persistence', async () => {
  let verified = 0;
  const { lock, writes } = setup({ read: async () => false, authenticate: async () => { verified++; return { success: true }; } });
  await lock.initialize(); await lock.setEnabled(true); await lock.setEnabled(false);
  assert.equal(verified, 2); assert.deepEqual(writes, [true, false]);
});
test('secure storage read failure fails closed and supports retry', async () => {
  let fail = true;
  const { lock } = setup({ read: async () => { if (fail) throw Error('storage unavailable'); return true; } });
  await lock.initialize(); assert.equal(lock.snapshot().ready, false); assert.equal(lock.snapshot().locked, true);
  fail = false; await lock.initialize(); assert.equal(lock.snapshot().ready, true); assert.equal(lock.snapshot().locked, true);
});
test('storage write failure cannot turn off an enabled lock', async () => {
  const { lock } = setup({ write: async () => { throw Error('write failed'); } });
  await lock.initialize(); await lock.setEnabled(false);
  assert.equal(lock.snapshot().enabled, true); assert.equal(lock.snapshot().locked, true);
});
test('overlapping prompts are suppressed and late results cannot unlock a background app', async () => {
  let resolve, calls = 0;
  const auth = new Promise(done => { resolve = done; });
  const { lock } = setup({ authenticate: async () => { calls++; return auth; } });
  await lock.initialize(); const attempt = lock.unlock(); await lock.unlock();
  lock.foreground(false); resolve({ success: true }); await attempt;
  assert.equal(calls, 1); assert.equal(lock.snapshot().locked, true);
  lock.foreground(true); assert.equal(lock.snapshot().locked, true);
});

test('screen lock during persistence cannot expose a newly enabled app lock', async () => {
  let resolve, started;
  const writing = new Promise(done => { started = done; });
  const { lock } = setup({ read: async () => false, write: () => { started(); return new Promise(done => { resolve = done; }); } });
  await lock.initialize();
  const enabling = lock.setEnabled(true); await writing;
  lock.screenLocked(); resolve(); await enabling;
  assert.equal(lock.snapshot().enabled, true);
  assert.equal(lock.snapshot().locked, true);
});
