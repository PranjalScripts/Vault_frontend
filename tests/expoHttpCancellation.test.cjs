const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const file = require.resolve('expo-server/adapter/http');
async function simulate(code, closed) {
  const error = Object.assign(new Error('test stream failure'), { code });
  const exports = {};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    exports, Headers, Request, Response, URL, AbortController,
    require(name) {
      if (name === 'node:stream/promises') return { pipeline: async () => { throw error; } };
      if (name === './abstract') return { createRequestHandler: () => async () => new Response('test') };
      if (name === './environment/node') return { createNodeEnv: () => ({}), createNodeRequestScope: () => (run, request) => run(request) };
      return require(name);
    },
  });
  let forwarded;
  const res = { destroyed: closed, on() {}, setHeaders() {} };
  await exports.createRequestHandler({})(
    { url: '/', method: 'GET', headers: { host: 'localhost' }, rawHeaders: [], aborted: false },
    res, value => { forwarded = value; },
  );
  return { forwarded, error };
}
test('closed client response does not surface a premature-close error', async () => {
  assert.equal((await simulate('ERR_STREAM_PREMATURE_CLOSE', true)).forwarded, undefined);
});
test('premature close without client closure remains visible', async () => {
  const result = await simulate('ERR_STREAM_PREMATURE_CLOSE', false);
  assert.equal(result.forwarded, result.error);
});
test('other stream failures remain visible even after closure', async () => {
  const result = await simulate('EIO', true);
  assert.equal(result.forwarded, result.error);
});
