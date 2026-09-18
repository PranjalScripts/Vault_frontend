const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const axios = require('axios');
const cacheModule = {};
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/api/responseCache.js'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(cacheModule);
const response = (config, data) => ({ config, data, headers: {}, status: 200, statusText: 'OK' });
function setup(adapter, options) { const api = axios.create({ adapter }); return { api, cache: cacheModule.installResponseCache(api, axios.getAdapter, options) }; }

test('all GET resources including search and trash cache and equivalent parameter ordering shares a request', async () => {
  let calls = 0;
  const { api } = setup(async config => response(config, { count: ++calls }));
  for (const url of ['/subjects/getAll-subjects', '/todos', '/vault', '/passcodes', '/search', '/trash']) {
    const first = await api.get(url, { params: { page: 1, query: 'test' } });
    const second = await api.get(url, { params: { query: 'test', page: 1 } });
    assert.deepEqual(first.data, second.data);
  }
  assert.equal(calls, 6);
});
test('concurrent identical reads share work and callers cannot mutate cached data', async () => {
  let calls = 0;
  const { api } = setup(async config => { calls++; await new Promise(resolve => setTimeout(resolve, 5)); return response(config, { nested: { value: 1 } }); });
  const [first, second] = await Promise.all([api.get('/todos'), api.get('/todos')]);
  first.data.nested.value = 9;
  assert.equal(second.data.nested.value, 1);
  assert.equal((await api.get('/todos')).data.nested.value, 1);
  assert.equal(calls, 1);
});
test('cache expires, is bounded, and remains isolated by account', async () => {
  let now = 0, calls = 0;
  const { api } = setup(async config => response(config, { count: ++calls }), { ttl: 10, maxEntries: 2, now: () => now });
  await api.get('/todos'); now = 11; await api.get('/todos'); assert.equal(calls, 2);
  await api.get('/todos', { headers: { Authorization: 'Bearer account-two' } }); assert.equal(calls, 3);
  await api.get('/search'); await api.get('/todos'); assert.equal(calls, 5);
});
test('writes always reach server and invalidate reads; forced refresh and reminder sync bypass cache', async () => {
  let calls = 0;
  const { api } = setup(async config => response(config, { count: ++calls }));
  await api.get('/todos'); await api.get('/todos'); assert.equal(calls, 1);
  await api.post('/todos', {}); await api.post('/todos', {}); await api.get('/todos'); assert.equal(calls, 4);
  await api.get('/todos', { __forceRefresh: true }); await api.get('/todos', { __reminderSync: true }); assert.equal(calls, 6);
  await api.post('/vault/recovery/key', {}); await api.post('/vault/recovery/key', {}); assert.equal(calls, 8);
});
test('late reads cannot repopulate a cache cleared by logout or mutation', async () => {
  let resolve, calls = 0;
  const { api, cache } = setup(config => { calls++; if (calls === 1) return new Promise(done => { resolve = () => done(response(config, { stale: true })); }); return Promise.resolve(response(config, { stale: false })); });
  const old = api.get('/vault');
  await new Promise(done => setImmediate(done));
  cache.clear(); resolve(); await old;
  assert.equal((await api.get('/vault')).data.stale, false);
  assert.equal(calls, 2);
});
test('failed and aborted requests do not poison cache; independent searches remain cancellable', async () => {
  let calls = 0;
  const { api } = setup(async config => { calls++; if (calls === 1) throw new Error('offline'); return response(config, { ok: true }); });
  await assert.rejects(api.get('/search'), /offline/);
  await api.get('/search'); await api.get('/search'); assert.equal(calls, 2);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(api.get('/search', { signal: controller.signal }), error => axios.isCancel(error));
  assert.equal((await api.get('/search')).data.ok, true);
});
