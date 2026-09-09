const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
// Compile the pure resolver in memory, without requiring a native/Expo test runtime.
const source = fs.readFileSync(path.join(__dirname, '../src/utils/logos/resolveLogo.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const resolver = { exports: {} };
new Function('require', 'module', 'exports', compiled)((name) => {
  assert.equal(name, './catalog.json');
  return require('../src/utils/logos/catalog.json');
}, resolver, resolver.exports);
const { resolveLogo, logoInitials } = resolver.exports;

test('Java, JavaScript and Spring Boot resolve to their own logos', () => {
  assert.equal(resolveLogo('java').id, 'devicon:java');
  assert.equal(resolveLogo('JavaScript').id, 'devicon:javascript');
  assert.equal(resolveLogo('springboot').id, 'simple:springboot');
  assert.equal(resolveLogo(' Spring Boot ').id, 'simple:springboot');
  assert.equal(resolveLogo('Spring').id, 'devicon:spring');
});
test('unknown subjects never receive an unrelated brand', () => {
  for (const name of ['GS', 'General Studies', 'History', 'Biology', 'My subject', 'Reacting to history', 'Springfield', 'JavaScriptish']) {
    assert.equal(resolveLogo(name), null, name);
  }
  assert.equal(logoInitials('GS'), 'GS');
  assert.equal(logoInitials('General Studies'), 'GS');
  assert.equal(logoInitials(''), '?');
});
test('common course aliases work and language punctuation stays meaningful', () => {
  assert.equal(resolveLogo('Core Java').id, 'devicon:java');
  assert.equal(resolveLogo('Java 21').id, 'devicon:java');
  assert.equal(resolveLogo('Spring Boot Notes').id, 'simple:springboot');
  assert.equal(resolveLogo('React.js').id, 'devicon:react');
  assert.equal(resolveLogo('C++').id, 'devicon:cplusplus');
  assert.equal(resolveLogo('C#').id, 'devicon:csharp');
  assert.equal(resolveLogo('C').id, 'devicon:c');
  assert.equal(resolveLogo('.NET').id, 'devicon:dot-net');
});
test('platform names, aliases and account labels use the matching brand', () => {
  for (const [name, id] of [['Gmail', 'simple:gmail'], ['GitHub', 'simple:github'], ['GitLab', 'simple:gitlab'], ['Instagram', 'simple:instagram'], ['FB', 'simple:facebook'], ['Amazon', 'simple:amazon'], ['Microsoft', 'simple:microsoft'], ['LinkedIn', 'devicon:linkedin'], ['ChatGPT', 'simple:openai'], ['Spotify (Personal)', 'simple:spotify'], ['Gmail - Work', 'simple:gmail']]) {
    assert.equal(resolveLogo(name, 'platform')?.id, id, name);
  }
});
test('platform URLs match known domains with boundaries and specificity', () => {
  for (const [name, id] of [['https://github.com/login', 'simple:github'], ['www.instagram.com', 'simple:instagram'], ['mail.google.com', 'simple:gmail'], ['https://accounts.google.com', 'simple:google'], ['amazon.in', 'simple:amazon']]) {
    assert.equal(resolveLogo(name, 'platform')?.id, id, name);
  }
  for (const name of ['github.com.evil.example', 'notgithub.com', 'https://example.com/github', 'https://github.com@evil.example', 'Unknown private platform', 'Digital bank']) {
    assert.equal(resolveLogo(name, 'platform'), null, name);
  }
});
test('catalog extends far beyond the previous handful of choices', () => {
  for (const name of ['Figma', 'Docker', 'Kubernetes', 'PostgreSQL', 'Rust', 'Python', 'Supabase', 'Vercel', 'Obsidian', 'Duolingo']) {
    const logo = resolveLogo(name, 'platform');
    assert.ok(logo, name);
    assert.match(logo.uri, /^https:\/\/cdn\.jsdelivr\.net\/(npm|gh)\//);
    assert.match(logo.color, /^#[a-f\d]{3,8}$/i);
  }
});
