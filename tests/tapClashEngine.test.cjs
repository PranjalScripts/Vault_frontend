const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/tapClash'));
const { TapClashEngine } = load('engine');
const { TAP_POWER } = load('config');
const { TouchTracker, keyboardPlayer } = load('input');
test('initial territory, tap directions, ignored countdown input, reset', () => {
  const engine = new TapClashEngine();
  assert.equal(engine.getSnapshot(0).bluePower, 50); assert.equal(engine.getSnapshot(0).redPower, 50);
  assert.equal(engine.blueTap(0), false); engine.start(0);
  engine.redTap(10); assert.equal(engine.getSnapshot(10).redPower, 50 + TAP_POWER);
  engine.blueTap(10); assert.equal(engine.getSnapshot(10).bluePower, 50);
  engine.reset(); assert.equal(engine.getSnapshot(100).blue.taps, 0);
});
test('simultaneous taps are counted and neutralize territory, including near a win', () => {
  const engine = new TapClashEngine(); engine.start(0);
  for (let i = 0; i < 1000; i++) engine.tapBatch(['red', 'blue'], i);
  let s = engine.getSnapshot(1000); assert.equal(s.bluePower, 50); assert.equal(s.red.taps, 1000); assert.equal(s.blue.taps, 1000);
  engine.reset(); engine.start(0);
  for (let i = 0; i < 24; i++) engine.blueTap(i);
  engine.tapBatch(['blue', 'red'], 30); s = engine.getSnapshot(30);
  assert.equal(s.status, 'running'); assert.equal(s.bluePower, 98);
});
test('clamps, winners, final taps lock and elapsed stops', () => {
  for (const player of ['red', 'blue']) {
    const engine = new TapClashEngine(); engine.start(0);
    engine.tapBatch(Array(40).fill(player), 5000);
    const s = engine.getSnapshot(6000);
    assert.equal(s.winner, player); assert.equal(s[`${player}Power`], 100); assert.equal(s.redPower + s.bluePower, 100);
    assert.equal(engine.blueTap(7000), false); assert.equal(engine.redTap(7000), false);
    assert.deepEqual(engine.getSnapshot(10000), s); assert.equal(s.elapsed, 5000);
  }
});
test('rolling, average, peak TPS and pause time use active match time', () => {
  const engine = new TapClashEngine(); engine.start(0);
  for (let i = 1; i <= 8; i++) engine.tapBatch(['red', 'blue'], i * 100);
  let s = engine.getSnapshot(1000);
  assert.equal(s.blue.rollingTPS, 8); assert.equal(s.blue.averageTPS, 8); assert.equal(s.blue.peakTPS, 8);
  assert.equal(engine.getSnapshot(1700).blue.rollingTPS, 1);
  engine.pause(1800); assert.equal(engine.blueTap(2000), false);
  assert.equal(engine.getSnapshot(20000).elapsed, 1800);
  engine.resume(20000); engine.blueTap(20200); s = engine.getSnapshot(20200);
  assert.equal(s.elapsed, 2000); assert.equal(s.blue.averageTPS, 4.5); assert.equal(s.blue.peakTPS, 8); assert.equal(s.blue.rollingTPS, 1);
});
test('multi-touch tracks new identifiers, releases and simultaneous opposite sides', () => {
  const tracker = new TouchTracker(), points = [{ id: 1, x: 40, y: 20 }, { id: 2, x: 40, y: 480 }];
  assert.deepEqual(tracker.down(points, 300, 500, .5, 'local').map(t => t.player), ['red', 'blue']);
  assert.equal(tracker.down(points, 300, 500, .5, 'local').length, 0);
  tracker.up([1]); assert.equal(tracker.down(points, 300, 500, .5, 'local').length, 1);
  tracker.clear(); assert.deepEqual(tracker.down(points, 300, 500, .5, 'computer').map(t => t.player), ['blue']);
  tracker.clear(); assert.equal(tracker.down([{ id: 3, x: -10, y: 2 }], 300, 500, .5, 'local').length, 0);
});
test('keyboard mapping ignores auto-repeat and typing', () => {
  assert.equal(keyboardPlayer('w', 'local', false, false), 'red');
  assert.equal(keyboardPlayer('ArrowDown', 'local', false, false), 'blue');
  assert.equal(keyboardPlayer(' ', 'computer', false, false), 'blue');
  assert.equal(keyboardPlayer('w', 'computer', false, false), null);
  assert.equal(keyboardPlayer(' ', 'computer', true, false), null);
  assert.equal(keyboardPlayer(' ', 'computer', false, true), null);
});
