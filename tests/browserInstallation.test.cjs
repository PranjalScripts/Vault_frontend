const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const loader = require('./helpers/loadTypeScript.cjs');

function setup(initial = null) {
  const old = new Map();
  const setGlobal = (key, value) => {
    old.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  const values = new Map();
  if (initial) values.set('vault-browser-installation-id', initial);
  const crypto = { randomUUID: () => '123e4567-e89b-42d3-a456-426614174000' };
  setGlobal('window', { localStorage: {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  } });
  setGlobal('crypto', crypto);
  const api = loader(path.join(__dirname, '../src/api'), {})('browserInstallation');
  return {
    api, values,
    cleanup: () => {
      for (const [key, descriptor] of old) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

test('browser installation ID is created once and survives repeat calls', t => {
  const { api, values, cleanup } = setup(); t.after(cleanup);
  const first = api.getBrowserInstallationId();
  const second = api.getBrowserInstallationId();
  assert.equal(first, '123e4567-e89b-42d3-a456-426614174000');
  assert.equal(second, first);
  assert.equal(values.get('vault-browser-installation-id'), first);
});

test('a valid stored browser installation ID is reused without regeneration', t => {
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const { api, cleanup } = setup(id); t.after(cleanup);
  assert.equal(api.getBrowserInstallationId(), id);
});

test('an invalid stored value is replaced with a valid UUID', t => {
  const { api, values, cleanup } = setup('not-a-uuid'); t.after(cleanup);
  const id = api.getBrowserInstallationId();
  assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i);
  assert.equal(values.get('vault-browser-installation-id'), id);
});
