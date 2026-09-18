const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/features/passcodes/presentation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const presentation = {};
new Function('exports', compiled)(presentation);

test('entry links accept only explicit web URLs and reject unsafe schemes', () => {
  for (const website of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,secret', 'not a URL']) assert.equal(presentation.entryWebsite({ platform: 'X', website }), null);
  assert.equal(presentation.entryWebsite({ platform: 'X' }), null);
  assert.equal(presentation.entryWebsite({ platform: 'https://x.com' }), 'https://x.com/');
  assert.equal(presentation.entryWebsite({ platform: 'X', website: 'https://x.com/account' }), 'https://x.com/account');
});
test('unknown metadata is not fabricated and explicit categories take precedence', () => {
  assert.equal(presentation.entryDate(), 'Not available');
  assert.equal(presentation.entryDate('invalid'), 'Not available');
  assert.equal(presentation.entryCategory({ platform: 'Custom service' }), 'Other');
  assert.equal(presentation.entryCategory({ platform: 'Instagram' }), 'Social');
  assert.equal(presentation.entryCategory({ platform: 'Instagram', category: 'Work' }), 'Work');
});
