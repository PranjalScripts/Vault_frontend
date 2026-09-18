const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
// Use the installed library's real Web Crypto implementation, without loading native bindings.
const encryption = require(path.join(path.dirname(require.resolve('rn-encryption')), 'web/index.js'));
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/crypto/vaultCrypto.js'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const vault = {};
new Function('require', 'exports', compiled)(name => { assert.equal(name, 'rn-encryption'); return encryption; }, vault);

test('password change preserves the master key and existing encrypted passcodes', async () => {
  const oldPassword = 'old-test-password'; const newPassword = 'new-test-password';
  const original = await vault.createVaultCredentials(oldPassword);
  const passcode = await vault.encryptWithVaultKey('existing test passcode', original.masterVaultKey);
  const stored = { passwordSalt: original.salt, passwordWrappedVaultKey: original.passwordWrappedVaultKey, verifier: original.verifier };
  const changed = await vault.rewrapVaultCredentials(oldPassword, newPassword, stored);
  assert.equal(changed.previousPasswordSalt, original.salt);
  assert.notEqual(changed.passwordSalt, original.salt);
  assert.equal(Object.hasOwn(changed, 'masterVaultKey'), false);
  const key = await vault.unlockVault(newPassword, changed.passwordSalt, changed.passwordWrappedVaultKey, changed.verifier);
  assert.equal(key, original.masterVaultKey);
  assert.equal(await vault.decryptWithVaultKey(passcode, key), 'existing test passcode');
  await assert.rejects(vault.unlockVault(oldPassword, changed.passwordSalt, changed.passwordWrappedVaultKey, changed.verifier));
  await assert.rejects(vault.rewrapVaultCredentials('wrong-password', newPassword, stored));
  assert.equal(await vault.unlockVault(oldPassword, stored.passwordSalt, stored.passwordWrappedVaultKey, stored.verifier), original.masterVaultKey);
});
test('new password validation rejects blank, short, unchanged and whitespace-wrapped passwords', async () => {
  for (const password of ['', '123', 'old-password', ' new-password ']) await assert.rejects(vault.rewrapVaultCredentials('old-password', password, {}));
});

test('failed authentication rejects quietly and the correct password still works afterward', async () => {
  const errors = [];
  const quietVault = {};
  new Function('require', 'exports', 'console', compiled)(() => encryption, quietVault, { ...console, error: (...args) => errors.push(args) });
  const original = await quietVault.createVaultCredentials('correct-password');
  await assert.rejects(quietVault.unlockVault('incorrect-password', original.salt, original.passwordWrappedVaultKey, original.verifier), { code: 'VAULT_UNLOCK_FAILED' });
  const corrupt = { ...original.verifier, authTag: Buffer.alloc(16).toString('base64') };
  await assert.rejects(quietVault.unlockVault('correct-password', original.salt, original.passwordWrappedVaultKey, corrupt), { code: 'VAULT_UNLOCK_FAILED' });
  assert.equal(errors.length, 0, 'handled authentication failures must not trigger LogBox');
  assert.equal(await quietVault.unlockVault('correct-password', original.salt, original.passwordWrappedVaultKey, original.verifier), original.masterVaultKey);
});

test('decryption uses the native-safe asynchronous bridge and handles its rejection', async () => {
  const bridgeVault = {};
  let calls = 0;
  new Function('require', 'exports', compiled)(() => ({
    ...encryption,
    decryptAES() { assert.fail('synchronous native decryption must not be called'); },
    async decryptAsyncAES() { calls++; throw new Error('Native authentication failure'); },
  }), bridgeVault);
  await assert.rejects(bridgeVault.decryptWithVaultKey({ ciphertext: 'payload', nonce: 'none' }, 'key'), { code: 'VAULT_DECRYPTION_FAILED' });
  assert.equal(calls, 1);
});

const unlockCompiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/crypto/unlockStoredVault.js'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const storedUnlock = {};
new Function('require', 'exports', unlockCompiled)(() => vault, storedUnlock);
const storedCredentials = credentials => ({ passwordSalt: credentials.salt, passwordWrappedVaultKey: credentials.passwordWrappedVaultKey, verifier: credentials.verifier });

test('stale credentials are refreshed once after a password change without replacing the master key', async () => {
  const original = await vault.createVaultCredentials('old-password');
  const stored = storedCredentials(original);
  const changed = await vault.rewrapVaultCredentials('old-password', 'new-password', stored);
  let requests = 0;
  const result = await storedUnlock.unlockStoredVault('new-password', stored, async () => { requests++; return { data: { data: changed } }; });
  assert.equal(result.key, original.masterVaultKey);
  assert.equal(result.credentials.passwordSalt, changed.passwordSalt);
  assert.equal(requests, 1);
});

test('valid cached credentials unlock offline; failed refresh is a connection error, not incorrect password', async () => {
  const original = await vault.createVaultCredentials('test-password');
  const stored = storedCredentials(original);
  let requests = 0;
  const offline = async () => { requests++; throw new Error('Offline'); };
  assert.equal((await storedUnlock.unlockStoredVault('test-password', stored, offline)).key, original.masterVaultKey);
  assert.equal(requests, 0);
  await assert.rejects(storedUnlock.unlockStoredVault('wrong-password', stored, offline), /Check your connection/);
  assert.equal(requests, 1);
});

test('missing credentials are fetched and wrong passwords stop after one refresh', async () => {
  const original = await vault.createVaultCredentials('test-password');
  let requests = 0;
  const fresh = async () => { requests++; return { data: { data: storedCredentials(original) } }; };
  assert.equal((await storedUnlock.unlockStoredVault('test-password', null, fresh)).key, original.masterVaultKey);
  assert.equal(requests, 1);
  requests = 0;
  await assert.rejects(storedUnlock.unlockStoredVault('wrong-password', storedCredentials(original), fresh), { code: 'VAULT_UNLOCK_FAILED' });
  assert.equal(requests, 1);
});
