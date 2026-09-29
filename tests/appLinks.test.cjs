const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { appLinkTarget, androidAppIntent } = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/utils'))('appLinks');
test('subject links preserve the token without triggering an import', () => {
  const token = 'a'.repeat(64);
  assert.equal(appLinkTarget(`https://vault.example/share?token=${token}&add=1`), `/share?token=${token}`);
  assert.equal(appLinkTarget('https://vault.example/share?token=bad'), null);
});
test('puzzle links keep their route and unsupported routes stay in the browser', () => {
  assert.equal(appLinkTarget('https://vault.example/puzzles/example'), '/puzzles/example');
  assert.equal(appLinkTarget('https://vault.example/games/puzzles/example'), '/games/puzzles/example');
  assert.equal(androidAppIntent('https://vault.example/passcodes'), null);
});
test('Android intent targets Vault and falls back to the same browser content', () => {
  const intent = androidAppIntent('https://vault.example/puzzles/example');
  assert.ok(intent.startsWith('intent://puzzles/example#Intent;scheme=vault;package=com.pranjal.vault;'));
  assert.ok(intent.includes(encodeURIComponent('https://vault.example/puzzles/example?browser=1')));
});
test('HTTPS origin registers all shared routes, local HTTP does not claim verification', () => {
  const configure = require('../app.config.js');
  const previous = process.env.EXPO_PUBLIC_WEB_URL;
  try {
    process.env.EXPO_PUBLIC_WEB_URL = 'https://vault.example';
    const config = configure({ config: { android: { package: 'com.pranjal.vault' } } });
    assert.equal(config.android.intentFilters[0].autoVerify, true);
    assert.deepEqual(config.android.intentFilters[0].data.map(d => d.host), Array(3).fill('vault.example'));
    process.env.EXPO_PUBLIC_WEB_URL = 'http://192.168.1.50:8081';
    assert.deepEqual(configure({ config: {} }).android.intentFilters, []);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_WEB_URL;
    else process.env.EXPO_PUBLIC_WEB_URL = previous;
  }
});
