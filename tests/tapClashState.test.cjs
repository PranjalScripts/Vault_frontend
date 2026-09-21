const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '../src/features/tapClash');
const load = require('./helpers/loadTypeScript.cjs')(root);
const { emptyClash, recordMatch, decodeClash, winRate } = load('stats');
const { TapClashEngine } = load('engine');
function result(id, mode = 'computer', winner = 'blue') { const engine = new TapClashEngine(); engine.start(0); engine.tapBatch(Array(25).fill(winner), 5000); return { ...engine.getSnapshot(5000), id, mode, difficulty: 'hard' }; }
test('stats record wins/losses/records once per completed match', () => {
  const r = result('one'); let s = recordMatch(emptyClash().stats, r);
  assert.equal(s.computer.wins, 1); assert.equal(s.computer.winsByLevel.hard, 1); assert.equal(s.computer.fastestVictory, 5000);
  assert.equal(s.computer.highestAverageTPS, 5); assert.equal(s.computer.peakTPS, 25); assert.equal(s.computer.mostTaps, 25);
  assert.deepEqual(recordMatch(s, r), s);
  s = recordMatch(s, result('two', 'computer', 'red')); assert.equal(s.computer.losses, 1); assert.equal(winRate(s), 50);
  s = recordMatch(s, result('three', 'local', 'red')); s = recordMatch(s, result('four', 'local', 'blue'));
  assert.equal(s.local.played, 2); assert.equal(s.local.redWins, 1); assert.equal(s.local.blueWins, 1); assert.equal(s.local.fastestMatch, 5000); assert.equal(s.local.highestTPS, 25);
});
test('preferences and stats roundtrip, invalid data recovers', () => {
  const data = emptyClash(); data.preferences.sound = true;
  assert.deepEqual(decodeClash(JSON.stringify(data)), data);
  for (const raw of ['{', 'null', '{}', JSON.stringify({ ...data, version: 4 }), JSON.stringify({ ...data, preferences: { sound: 'yes' } })]) assert.deepEqual(decodeClash(raw), emptyClash());
});
test('native saves serialize and preserve user separation', async () => {
  const saved = new Map(); let active = 0, maximum = 0;
  const storage = require('./helpers/loadTypeScript.cjs')(root, { 'react-native': { Platform: { OS: 'android' } }, '@/notifications/snapshotStore': {
    readSnapshotValue: async key => saved.get(key) ?? null,
    writeSnapshotValue: async (key, value) => { active++; maximum = Math.max(maximum, active); await new Promise(r => setTimeout(r, 1)); saved.set(key, value); active--; },
  } })('storage');
  const a = emptyClash(), b = { ...a, preferences: { ...a.preferences, sound: true } };
  await Promise.all([storage.saveClash('one', a), storage.saveClash('one', b)]);
  assert.equal(maximum, 1); assert.deepEqual(await storage.loadClash('one'), b); assert.deepEqual(await storage.loadClash('two'), a);
});
