const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/path'));
const { generatePuzzleSync } = load('engine/generator');
const { newGame, applyMove, hintFor, recordCompletion, emptyStats, currentStreak, formatTime } = load('state/game');
const { decodeState, emptyState } = load('state/snapshot');
const { dailySeed } = load('engine/daily');
const { fingerprint } = load('engine/fingerprint');
const { runSteps } = load('engine/solver');
const { generateSteps } = load('engine/generator');
const puzzle = generatePuzzleSync({ seed: 'state', difficulty: 'easy', variation: 'walls' });
const solution = puzzle.solution.map(c => c.row * puzzle.cols + c.col);
test('progress and counters survive JSON roundtrip; malformed snapshots recover safely', () => {
  let game = newGame(puzzle, 'attempt1');
  game = applyMove(game, solution[0]).game;
  game = { ...game, elapsed: 12345, hints: 1, mistakes: 2 };
  const state = { ...emptyState(), game };
  assert.deepEqual(decodeState(JSON.stringify(state)), state);
  for (const raw of ['{', 'null', '{}', JSON.stringify({ ...state, game: { ...game, path: [999] } }), JSON.stringify({ ...state, version: 7 })]) assert.deepEqual(decodeState(raw), emptyState());
});
test('completion is counted once and UTC day streaks expire', () => {
  let game = newGame(puzzle, 'attempt1');
  for (const cell of solution) game = applyMove(game, cell).game;
  assert.ok(game.completed); assert.equal(game.moves, solution.length);
  game.elapsed = 61000;
  const stats = recordCompletion(emptyStats(), game, '2026-09-21');
  assert.equal(stats.solved, 1); assert.equal(stats.best.easy, 61000);
  assert.deepEqual(recordCompletion(stats, game, '2026-09-21'), stats);
  const tomorrow = recordCompletion(stats, { ...game, attemptId: 'attempt2', elapsed: 50000 }, '2026-09-22');
  assert.equal(tomorrow.streak, 2); assert.equal(tomorrow.best.easy, 50000);
  assert.equal(currentStreak(tomorrow, '2026-09-24'), 0);
  assert.equal(formatTime(97000), '01:37');
});
test('hints reveal one continuation or a safe backtrack point', () => {
  const game = newGame(puzzle, 'hint');
  assert.deepEqual(hintFor(game), { cell: solution[0], backtrack: false });
  assert.deepEqual(hintFor({ ...game, path: solution.slice(0, 3) }), { cell: solution[3], backtrack: false });
  assert.deepEqual(hintFor({ ...game, path: [solution[0], solution[2]] }), { cell: solution[0], backtrack: true });
});
test('daily seed is UTC and fingerprints ignore rotation/reflection', () => {
  assert.equal(dailySeed('easy', new Date('2026-09-22T01:00:00+05:30')), 'path-daily-2026-09-21-easy-v2');
  const transform = c => ({ row: c.col, col: puzzle.rows - 1 - c.row });
  const rotated = { ...puzzle, checkpoints: puzzle.checkpoints.map(c => ({ ...c, position: transform(c.position) })), walls: puzzle.walls.map(w => ({ from: transform(w.from), to: transform(w.to) })), blockedCells: puzzle.blockedCells.map(transform) };
  assert.equal(fingerprint(rotated), fingerprint(puzzle));
});
test('async generation yields to event loop and supports cancellation', async () => {
  const controller = new AbortController(); let ticks = 0;
  const interval = setInterval(() => ticks++, 1);
  try {
    const p = await runSteps(generateSteps({ seed: 'async', difficulty: 'expert', variation: 'sparse' }));
    assert.equal(p.difficulty, 'expert'); assert.ok(ticks > 0);
    controller.abort();
    await assert.rejects(runSteps(generateSteps({ seed: 'abort', difficulty: 'expert', variation: 'sparse' }), controller.signal), /cancelled/);
  } finally { clearInterval(interval); }
});
test('resolved random variation metadata reproduces the exact board', () => {
  const p = generatePuzzleSync({ seed: 'random-metadata', difficulty: 'medium', variation: 'random' });
  assert.deepEqual(generatePuzzleSync({ seed: p.seed, difficulty: p.difficulty, variation: p.variation }), p);
});
test('timer excludes idle, background and finished time, with no rerender drift', () => {
  const { advanceTimer } = load('state/game');
  let game = newGame(puzzle, 'timer');
  assert.equal(advanceTimer(game, 0, 9000, true).game.elapsed, 0);
  game.started = true;
  let result = advanceTimer(game, null, 10000, true);
  result = advanceTimer(result.game, result.clock, 11000, true);
  result = advanceTimer(result.game, result.clock, 11500, false);
  assert.equal(result.game.elapsed, 1500); assert.equal(result.clock, null);
  result = advanceTimer(result.game, result.clock, 50000, true);
  result = advanceTimer(result.game, result.clock, 51000, true);
  assert.equal(result.game.elapsed, 2500);
  assert.equal(advanceTimer({ ...result.game, completed: true }, result.clock, 80000, true).game.elapsed, 2500);
});
test('native storage serializes writes and reads the last valid save after a failed write', async () => {
  const values = new Map(); let active = 0, maxActive = 0, fail = false;
  const storageLoad = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/path'), {
    'react-native': { Platform: { OS: 'android' } },
    '@/notifications/snapshotStore': {
      readSnapshotValue: async key => values.get(key) ?? null,
      writeSnapshotValue: async (key, value) => {
        active++; maxActive = Math.max(maxActive, active);
        await new Promise(resolve => setTimeout(resolve, 2)); active--;
        if (fail) throw Error('storage unavailable');
        values.set(key, value);
      },
    },
  });
  const storage = storageLoad('state/storage');
  const a = emptyState(), b = { ...a, difficulty: 'hard' };
  await Promise.all([storage.saveState('test', a), storage.saveState('test', b)]);
  assert.equal(maxActive, 1); assert.deepEqual(await storage.loadState('test'), b);
  fail = true; await assert.rejects(storage.saveState('test', a));
  assert.deepEqual(await storage.loadState('test'), b);
});
test('corrupt board constraints are not resumed', () => {
  for (const changed of [{ blockedCells: [{ row: -1, col: 0 }] }, { walls: [{ from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }] }]) {
    const state = { ...emptyState(), game: newGame({ ...puzzle, ...changed }, 'corrupt') };
    assert.equal(decodeState(JSON.stringify(state)).game, null);
  }
});
test('legacy unnumbered tails retire only the board while retaining stats and preferences', () => {
  const legacy = { ...puzzle, generatorVersion: 1, finishAtLastCheckpoint: undefined, checkpoints: puzzle.checkpoints.slice(0, -1) };
  const state = { ...emptyState(), game: newGame(legacy, 'legacy'), difficulty: 'hard', stats: { ...emptyStats(), played: 12 } };
  const decoded = decodeState(JSON.stringify(state));
  assert.equal(decoded.game, null);
  assert.deepEqual(decoded.stats, state.stats);
  assert.equal(decoded.difficulty, 'hard');
});
