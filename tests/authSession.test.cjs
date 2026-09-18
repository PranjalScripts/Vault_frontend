const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function setup(os = 'web', getItemAsync = async () => null) {
  let rejectResponse;
  const storage = new Map();
  const api = { defaults: { headers: { common: {} } }, interceptors: { response: { use: (_, reject) => { rejectResponse = reject; } } } };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../src/api/auth.js'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'exports', 'window', code)((name) => {
    if (name === 'react-native') return { Platform: { OS: os } };
    if (name === 'expo-secure-store') return { getItemAsync };
    if (name === './client') return { default: api, clearApiCache() {} };
    throw new Error(name);
  }, exports, { localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  return { auth: exports, api, reject: error => rejectResponse(error) };
}
test('saved web session restores authorization on first load', async () => {
  const { auth, api } = setup();
  await auth.saveAuthToken('session', { name: 'Test' });
  assert.equal(await auth.getAuthToken(), 'session');
  assert.equal(api.defaults.headers.common.Authorization, 'Bearer session');
});
test('a late storage read cannot overwrite a newer session', async () => {
  let resolve;
  const { auth, api } = setup('android', () => new Promise(done => { resolve = done; }));
  const restoring = auth.getAuthToken();
  auth.setAuthToken('new-session');
  resolve('old-session');
  assert.equal(await restoring, 'new-session');
  assert.equal(api.defaults.headers.common.Authorization, 'Bearer new-session');
});
test('401 from an old session or anonymous login does not log out a new session', async () => {
  const { auth, reject } = setup();
  await auth.saveAuthToken('new-session');
  for (const headers of [{ Authorization: 'Bearer old-session' }, {}]) {
    await assert.rejects(reject({ response: { status: 401 }, config: { headers } }));
    assert.equal(await auth.getAuthToken(), 'new-session');
  }
});
test('401 for the current session still logs out', async () => {
  const { auth, reject } = setup();
  await auth.saveAuthToken('expired');
  await assert.rejects(reject({ response: { status: 401 }, config: { headers: { Authorization: 'Bearer expired' } } }));
  assert.equal(await auth.getAuthToken(), null);
});
