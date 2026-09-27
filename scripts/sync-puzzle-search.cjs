// Run after editing the public puzzle catalog: node scripts/sync-puzzle-search.cjs
const fs = require('node:fs');
const path = require('node:path');
const load = require('../tests/helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/puzzles'));
const publicCatalog = load('puzzles').puzzles.map(({ id, title, category, difficulty, question, conditions }) => ({ id, title, category, difficulty, question, ...(conditions ? { conditions } : {}) }));
fs.writeFileSync(path.join(__dirname, '../../Backend/data/puzzleCatalog.json'), JSON.stringify(publicCatalog, null, 2) + '\n');
