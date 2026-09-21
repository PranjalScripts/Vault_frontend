const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
module.exports = function loader(root, mocks = {}) {
  const cache = new Map();
  function load(file) {
    const resolved = path.resolve(root, file.endsWith('.ts') ? file : `${file}.ts`);
    if (cache.has(resolved)) return cache.get(resolved);
    const exports = {}; cache.set(resolved, exports);
    const code = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    new Function('exports', 'require', code)(exports, name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (!name.startsWith('.')) throw Error(`Unexpected import ${name}`);
      return load(path.resolve(path.dirname(resolved), name));
    });
    return exports;
  }
  return load;
};
