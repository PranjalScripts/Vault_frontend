const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/path/engine'));
const { PathStroke } = load('stroke');
const { move, isComplete } = load('validator');
const puzzle = { rows: 3, cols: 3, checkpoints: [{ number: 1, position: { row: 0, col: 0 } }, { number: 2, position: { row: 2, col: 2 } }], blockedCells: [], walls: [], finishAtLastCheckpoint: true };
const point = cell => ({ x: (cell % 3 + .5) * 100, y: (Math.floor(cell / 3) + .5) * 100 });
test('continuous stroke fills intermediate cells, turns, backtracks and resumes', () => {
  const stroke = new PathStroke();
  assert.deepEqual(stroke.begin(puzzle, [], point(0), 300), [0]);
  assert.deepEqual(stroke.update(point(2)), [1, 2]);
  assert.deepEqual(stroke.update(point(5)), [5]);
  assert.deepEqual(stroke.update(point(3)), [4, 3]);
  assert.deepEqual(stroke.update(point(4)), [4]);
  stroke.end();
  assert.deepEqual(stroke.begin(puzzle, [0, 1, 2, 5, 4], point(4), 300), []);
  assert.deepEqual(stroke.update(point(3)), [3]);
  assert.deepEqual(stroke.update(point(6)), [6]);
  assert.deepEqual(stroke.update(point(8)), [7, 8]);
  assert.equal(isComplete(puzzle, [0, 1, 2, 5, 4, 3, 6, 7, 8]), true);
});
test('diagonal, walls and leaving the board cannot produce jumps', () => {
  const stroke = new PathStroke();
  stroke.begin(puzzle, [], point(0), 300);
  assert.deepEqual(stroke.update(point(4)), [4]);
  assert.equal(move(puzzle, [0], 4).valid, false);
  assert.deepEqual(stroke.update(point(5)), []);
  stroke.begin(puzzle, [], point(0), 300);
  stroke.update({ x: -20, y: 50 });
  assert.deepEqual(stroke.update(point(2)), []);
  stroke.update(point(0));
  assert.deepEqual(stroke.update(point(1)), [1]);
  const walled = { ...puzzle, walls: [{ from: { row: 0, col: 1 }, to: { row: 0, col: 2 } }] };
  stroke.begin(walled, [], point(0), 300);
  assert.deepEqual(stroke.update(point(2)), [1, 2]);
  assert.equal(move(walled, [0, 1], 2).valid, false);
  assert.deepEqual(stroke.update(point(5)), []);
});
test('all numbered checkpoints with an empty square never counts as complete', () => {
  const legacy = { ...puzzle, finishAtLastCheckpoint: false, checkpoints: [{ number: 1, position: { row: 0, col: 0 } }, { number: 2, position: { row: 2, col: 1 } }] };
  const partial = [0, 1, 2, 5, 4, 3, 6, 7];
  assert.equal(isComplete(legacy, partial), false);
  assert.equal(isComplete(legacy, [...partial, 8]), true);
  assert.equal(move(puzzle, [0, 1, 2, 5], 8).valid, false);
});
test('previous generator versions remain reproducible', () => {
  const { generatePuzzleSync } = load('generator');
  const options = { seed: 'legacy-replay', difficulty: 'easy', variation: 'classic', generatorVersion: 1 };
  const first = generatePuzzleSync(options);
  assert.equal(first.generatorVersion, 1);
  assert.equal(first.finishAtLastCheckpoint, undefined);
  assert.deepEqual(generatePuzzleSync(options), first);
  assert.equal(isComplete(first, first.solution.map(p => p.row * first.cols + p.col)), true);
});
test('preview follows within a cell without committing moves and clears on cancellation', () => {
  const stroke = new PathStroke();
  assert.deepEqual(stroke.begin(puzzle, [], point(1), 300), []);
  assert.equal(stroke.active, false);
  stroke.begin(puzzle, [], point(0), 300);
  const finger = { x: 90, y: 51 };
  assert.deepEqual(stroke.update(finger), []);
  assert.deepEqual(stroke.preview(finger), { from: point(0), to: finger });
  assert.deepEqual(stroke.update(finger), []);
  // Return to the center so the next sample crosses an exact grid corner.
  // From (90, 51), the line to cell 4 legally traverses cell 1 first.
  stroke.update(point(0));
  stroke.update(point(4));
  assert.equal(stroke.preview(point(4)), null);
  stroke.end();
  assert.equal(stroke.preview(point(0)), null);
  assert.deepEqual(stroke.update(point(1)), []);
  assert.deepEqual(stroke.begin(puzzle, [], { x: NaN, y: 0 }, 300), []);
});
test('boundary sweeps remain adjacent and ordered checkpoints reject skipping', () => {
  const stroke = new PathStroke();
  stroke.begin(puzzle, [], { x: 1, y: 99.9 }, 300);
  assert.deepEqual(stroke.update({ x: 299.9, y: 99.9 }), [1, 2]);
  const numbered = { ...puzzle, checkpoints: [puzzle.checkpoints[0], { number: 2, position: { row: 1, col: 0 } }, { number: 3, position: { row: 0, col: 1 } }, { number: 4, position: { row: 2, col: 2 } }] };
  stroke.begin(numbered, [], point(0), 300);
  assert.deepEqual(stroke.update(point(2)), [1]);
  assert.equal(move(numbered, [0], 1).valid, false);
  assert.deepEqual(stroke.update(point(5)), []);
});
