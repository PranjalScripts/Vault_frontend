const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/path/engine'));
const { strokePath } = load('visualStroke');
const { PathStroke } = load('stroke');
const puzzle = { rows: 3, cols: 3, checkpoints: [{ number: 1, position: { row: 0, col: 0 } }, { number: 2, position: { row: 2, col: 2 } }], blockedCells: [], walls: [], finishAtLastCheckpoint: true };
test('straight runs and corners have exactly one connected subpath', () => {
  assert.equal(strokePath([0, 1, 2, 5], 3, 100, null), 'M 50 50 L 150 50 L 250 50 L 250 150');
  assert.equal(strokePath([], 3, 100, null), '');
});
test('subcell samples move the live endpoint without any logical move', () => {
  const stroke = new PathStroke();
  stroke.begin(puzzle, [], { x: 50, y: 50 }, 300);
  for (const x of [60, 70, 85, 99]) {
    const point = { x, y: 50 };
    assert.deepEqual(stroke.update(point), []);
    assert.equal(strokePath(stroke.confirmedPath, 3, 100, stroke.preview(point).to), `M 50 50 L ${x} 50`);
  }
});
test('crossing a cell edge does not jump the visible tip ahead to its center', () => {
  assert.equal(strokePath([0], 3, 100, { x: 99, y: 50 }), 'M 50 50 L 99 50');
  assert.equal(strokePath([0, 1], 3, 100, { x: 101, y: 50 }), 'M 50 50 L 101 50');
  assert.equal(strokePath([0, 1], 3, 100, { x: 175, y: 50 }), 'M 50 50 L 150 50 L 175 50');
});
test('backtracking shortens before and after logical removal, including a turn', () => {
  assert.equal(strokePath([0, 1, 2], 3, 100, { x: 210, y: 50 }), 'M 50 50 L 150 50 L 210 50');
  assert.equal(strokePath([0, 1], 3, 100, { x: 190, y: 50 }), 'M 50 50 L 150 50 L 190 50');
  assert.equal(strokePath([0, 1, 4], 3, 100, { x: 150, y: 110 }), 'M 50 50 L 150 50 L 150 110');
  assert.equal(strokePath([0, 1], 3, 100, { x: 150, y: 90 }), 'M 50 50 L 150 50 L 150 90');
});
test('invalid moves and board departures remove only the unconfirmed tail', () => {
  const stroke = new PathStroke();
  stroke.begin(puzzle, [], { x: 50, y: 50 }, 300);
  stroke.update({ x: 150, y: 50 });
  stroke.update({ x: 350, y: 50 });
  assert.equal(stroke.preview({ x: 350, y: 50 }), null);
  assert.equal(strokePath(stroke.confirmedPath, 3, 100, null), 'M 50 50 L 150 50');
  stroke.end();
  assert.equal(stroke.preview({ x: 150, y: 50 }), null);
});
