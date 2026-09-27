const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { puzzles } = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/puzzles'))('puzzles');
test('universal search catalog matches public puzzles and contains no answers', () => {
 const catalog = require('../../Backend/data/puzzleCatalog.json');
 assert.deepEqual(catalog,puzzles,'Run node scripts/sync-puzzle-search.cjs after catalog edits');
 for(const puzzle of catalog){assert.equal(puzzle.answer,undefined);assert.equal(puzzle.solution,undefined);}
});
