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
