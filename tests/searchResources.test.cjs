const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/searchResources.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const helpers = {};
new Function('exports', compiled)(helpers);
test('topic links and attachments open as resources, prioritizing the matching filename', () => {
  const resources = helpers.topicResources({ url: 'https://example.com/course', files: [{ fileName: 'lesson.pdf', fileUrl: 'https://example.com/lesson.pdf' }, { fileName: 'answers.pdf', fileUrl: 'https://example.com/answers.pdf' }] });
  assert.equal(resources.length, 3);
  assert.equal(helpers.primaryResource(resources, 'course').url, 'https://example.com/course');
  assert.equal(helpers.primaryResource(resources, 'ANSWERS').url, 'https://example.com/answers.pdf');
  assert.equal(helpers.primaryResource(resources.slice(1), '').label, 'lesson.pdf');
});
test('missing and unsafe URLs never become launchable resources', () => {
  for (const url of [undefined, '', 'javascript:alert(1)', 'data:text/html,test', 'file:///tmp/a', 'not a url']) assert.equal(helpers.topicResources({ url }).length, 0);
  assert.equal(helpers.primaryResource([], 'topic'), undefined);
});
