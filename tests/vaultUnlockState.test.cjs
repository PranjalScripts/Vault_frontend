const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');

// Exercise provider callbacks with persistent hook slots and deferred decryption.
function providerHarness(unlockStoredVault) {
  const slots = [];
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: {} }),
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ?? (slots[i] = { current: initial }); },
    useCallback: fn => fn,
    useMemo: fn => fn(),
    useEffect() {},
    createElement: (_type, props) => props.value,
  };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/contexts/vaultContext.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const exports = {};
  new Function('require', 'exports', source)(name => {
    if (name === 'react') return react;
    if (name.endsWith('/unlockStoredVault')) return { unlockStoredVault };
    if (name.endsWith('/vaultCrypto')) return {};
    if (name.endsWith('/api')) return {};
    throw new Error(name);
  }, exports);
  return () => { cursor = 0; return exports.VaultProvider({ children: null }); };
}
const credentials = { passwordSalt: 'salt', passwordWrappedVaultKey: {}, verifier: {} };

test('overlapping unlock attempts share one operation and cannot overwrite success', async () => {
  let resolve;
  let calls = 0;
  const render = providerHarness(() => { calls++; return new Promise(done => { resolve = done; }); });
  const context = render();
  const first = context.unlockVault('password');
  const second = context.unlockVault('password');
  assert.equal(first, second);
  assert.equal(calls, 1);
  resolve({ key: 'master-key', credentials });
  assert.equal(await first, true);
  assert.equal(render().status, 'unlocked');
});

test('locking during an unlock prevents a delayed result from restoring the key', async () => {
  let resolve;
  const render = providerHarness(() => new Promise(done => { resolve = done; }));
  const context = render();
  const pending = context.unlockVault('password');
  context.lockVault();
  resolve({ key: 'master-key', credentials });
  await assert.rejects(pending, /session changed/);
  assert.equal(render().vaultKey, null);
  assert.notEqual(render().status, 'unlocked');
});

test('failed unlock stays locked and can be retried successfully', async () => {
  let attempts = 0;
  const render = providerHarness(async () => {
    if (++attempts === 1) throw new Error('Could not unlock');
    return { key: 'master-key', credentials };
  });
  await assert.rejects(render().unlockVault('wrong'), /Could not unlock/);
  assert.equal(render().status, 'locked');
  assert.equal(render().vaultKey, null);
  assert.equal(await render().unlockVault('correct'), true);
  assert.equal(render().status, 'unlocked');
});

test('blocked browser session storage does not report a correct password as incorrect', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  try {
    const render = providerHarness(async () => ({ key: 'master-key', credentials }));
    assert.equal(await render().unlockVault('correct'), true);
    assert.equal(render().vaultKey, 'master-key');
    assert.equal(render().status, 'unlocked');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor);
    else delete globalThis.sessionStorage;
  }
});
