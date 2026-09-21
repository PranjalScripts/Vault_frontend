const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/path/engine'));
const { generatePuzzleSync } = load('generator');
const { solvePuzzle } = load('solver');
const { move, isComplete, validPath } = load('validator');
const { difficulties, variations, indexOf } = load('types');
const { fingerprint } = load('fingerprint');
const { classifyDifficulty } = load('difficulty');
test('480 seeded boards cover all difficulties and variations with proven unique solutions', { timeout: 600000 }, () => {
  for (const difficulty of difficulties) for (const variation of variations) {
    let maxClues = 0;
    for (let seed = 0; seed < 20; seed++) {
      const options = { seed: `property-${seed}`, difficulty, variation };
      const p = generatePuzzleSync(options);
      const solution = p.solution.map(c => indexOf(c, p.cols));
      assert.ok(isComplete(p, solution), JSON.stringify(options));
      assert.equal(new Set(solution).size, solution.length);
      assert.equal(indexOf(p.checkpoints.at(-1).position, p.cols), solution.at(-1));
      assert.equal(p.finishAtLastCheckpoint, true);
      const solved = solvePuzzle(p);
      assert.equal(solved.exhausted, false); assert.equal(solved.count, 1);
      assert.deepEqual(solved.solution, solution);
      assert.equal(p.variation, variation);
      assert.equal(classifyDifficulty(p.difficultyScore), difficulty);
      assert.deepEqual(generatePuzzleSync(options), p);
      assert.equal(typeof fingerprint(p), 'string');
      maxClues = Math.max(maxClues, p.checkpoints.length);
    }
    console.log(difficulty, variation, 'passed; max clues', maxClues);
  }
});
test('moves reject invalid starts, jumps, diagonals, revisits and permit backward undo', () => {
  const p = generatePuzzleSync({ seed: 'moves', difficulty: 'easy', variation: 'mixed' });
  const solution = p.solution.map(c => indexOf(c, p.cols));
  assert.equal(move(p, [], solution[1]).valid, false);
  assert.equal(move(p, [], -1).valid, false);
  assert.equal(move(p, [], 100).valid, false);
  assert.deepEqual(move(p, solution.slice(0, 3), solution[1]).path, solution.slice(0, 2));
  assert.equal(move(p, solution.slice(0, 4), solution[0]).valid, false);
  assert.equal(validPath(p, [...solution, solution[0]]), false);
  assert.equal(isComplete(p, solution.slice(0, -1)), false);
  assert.equal(move(p, [solution[0]], indexOf(p.checkpoints[2].position, p.cols)).valid, false);
  for (const b of p.blockedCells) assert.equal(move(p, [solution[0]], indexOf(b, p.cols)).valid, false);
});
test('solution counter separates impossible, unique, multiple and incomplete searches', () => {
  const p = { rows: 2, cols: 2, checkpoints: [{ number: 1, position: { row: 0, col: 0 } }], walls: [], blockedCells: [] };
  assert.equal(solvePuzzle(p).count, 2);
  assert.equal(solvePuzzle(p, 2, 1).exhausted, true);
  const unique = { ...p, checkpoints: [...p.checkpoints, { number: 2, position: { row: 0, col: 1 } }, { number: 3, position: { row: 1, col: 1 } }] };
  assert.equal(solvePuzzle(unique).count, 1);
  assert.equal(solvePuzzle({ ...p, walls: [{ from: { row: 0, col: 0 }, to: { row: 0, col: 1 } }, { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } }] }).count, 0);
});
test('walls, skipped checkpoints, diagonals, and jumps reject moves without changing the path', () => {
  const p = { rows: 3, cols: 3, checkpoints: [{ number: 1, position: { row: 0, col: 0 } }, { number: 2, position: { row: 2, col: 2 } }, { number: 3, position: { row: 0, col: 1 } }], blockedCells: [{ row: 1, col: 1 }], walls: [{ from: { row: 0, col: 0 }, to: { row: 1, col: 0 } }] };
  for (const cell of [1, 2, 3, 4, 6, 8, -1, 9]) {
    const result = move(p, [0], cell);
    assert.equal(result.valid, false); assert.deepEqual(result.path, [0]);
  }
});
