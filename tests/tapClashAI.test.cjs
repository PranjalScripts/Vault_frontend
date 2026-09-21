const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/tapClash'));
const { TapClashAI, nextTapDelay } = load('ai');
const { randomFor } = load('random');
const { AI_DIFFICULTIES, MAX_AI_TPS } = load('config');
const { TapClashEngine } = load('engine');
function fakeTime() {
  let now = 0, id = 0; const tasks = new Map();
  return { now: () => now, schedule(cb, delay) { const key = ++id; tasks.set(key, { cb, due: now + delay }); return () => tasks.delete(key); }, count: () => tasks.size,
    advance(ms) { const end = now + ms; let guard = 0; while (tasks.size) { const [key, t] = [...tasks].sort((a, b) => a[1].due - b[1].due)[0]; if (t.due > end) break; assert.ok(++guard < 100000); tasks.delete(key); now = t.due; t.cb(); } now = end; } };
}
test('AI stays within approximate difficulty rates across 150 seeded schedules', () => {
  for (const [difficulty, config] of Object.entries(AI_DIFFICULTIES)) {
    for (let seed = 0; seed < 50; seed++) {
      const random = randomFor(`${difficulty}-${seed}`); let time = config.reactionDelay, taps = 0;
      while (time < 60000) { taps++; const delay = nextTapDelay(difficulty, random); assert.ok(delay >= 1000 / MAX_AI_TPS); time += delay; }
      assert.ok(taps / 60 >= config.minTPS && taps / 60 <= config.maxTPS, `${difficulty}: ${taps / 60}`);
    }
  }
});
test('AI has one timer; pause/resume skips background and stop cleans up', () => {
  const clock = fakeTime(); let taps = 0;
  const ai = new TapClashAI('hard', randomFor('cleanup'), () => { taps++; return true; }, clock);
  ai.start(); assert.equal(clock.count(), 1); clock.advance(1000);
  ai.pause(); const before = taps; assert.equal(clock.count(), 0); clock.advance(10000); assert.equal(taps, before);
  ai.resume(); assert.equal(clock.count(), 1); clock.advance(1000); assert.ok(taps > before);
  ai.stop(); assert.equal(clock.count(), 0); const after = taps; clock.advance(10000); assert.equal(taps, after);
  ai.start(); ai.start(); assert.equal(clock.count(), 1); ai.stop();
});
test('AI stops immediately when its tap ends the game', () => {
  const clock = fakeTime(), engine = new TapClashEngine(); engine.start(0);
  const ai = new TapClashAI('hard', randomFor('finish'), time => { engine.redTap(time); return engine.getSnapshot(time).status === 'running'; }, clock);
  ai.start(); clock.advance(10000); assert.equal(engine.getSnapshot(clock.now()).winner, 'red'); assert.equal(clock.count(), 0);
});
