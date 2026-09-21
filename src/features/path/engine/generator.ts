import { validatePuzzle } from './validator';
import { createRng, hash } from './rng';
import { Difficulty, Variation, PathPuzzle, positionOf, variations } from './types';
import { graph, edgeKey } from './rules';
import { solveSteps, runSteps } from './solver';
import { classifyDifficulty, difficultyScore, turnCount } from './difficulty';
import { profiles, variationRules } from './variations';
export const GENERATOR_VERSION = 2;
export type GenerateOptions = { seed: string; difficulty: Difficulty; variation: Variation | 'random'; generatorVersion?: 1 | 2; maxAttempts?: number; maxNodes?: number };
/** A backbite reverses a prefix connected to the endpoint, preserving a covering path. */
function* makePath(size: number, rng: () => number, turns: boolean): Generator<void, number[]> {
  let path = Array.from({ length: size * size }, (_, i) => Math.floor(i / size) * size + (Math.floor(i / size) % 2 ? size - 1 - i % size : i % size));
  let best = path;
  let bestTurns = turns ? turnCount(path, size) : 0;
  for (let step = 0; step < size * size * 24; step++) {
    if (step % 32 === 0) yield;
    if (rng() < .5) path.reverse();
    const first = path[0];
    const choices = path.map((cell, i) => ({ cell, i })).filter(({ cell, i }) => i > 1 && Math.abs(Math.floor(cell / size) - Math.floor(first / size)) + Math.abs(cell % size - first % size) === 1);
    if (choices.length) {
      const { i } = choices[Math.floor(rng() * choices.length)];
      path = [...path.slice(0, i).reverse(), ...path.slice(i)];
    }
    if (!turns) best = path;
    else {
      const count = turnCount(path, size);
      if (count > bestTurns) { best = [...path]; bestTurns = count; }
    }
  }
  return best;
}
export function* generateSteps(options: GenerateOptions): Generator<void, PathPuzzle> {
  const { seed, difficulty } = options;
  const version = options.generatorVersion ?? GENERATOR_VERSION;
  if (version !== 1 && version !== 2) throw new Error('Unsupported generator version');
  const choose = createRng(`variation:${version}:${difficulty}:${seed}`);
  const variation = options.variation === 'random' ? variations[Math.floor(choose() * variations.length)] : options.variation;
  const rng = createRng(`${version}:${difficulty}:${variation}:${seed}`);
  const profile = profiles[difficulty], rules = variationRules(variation), size = profile.size;
  for (let attempt = 0; attempt < (options.maxAttempts ?? 12); attempt++) {
    yield;
    let path = yield* makePath(size, rng, rules.turns);
    if (turnCount(path, size) / path.length < (rules.turns ? .65 : profile.minTurns)) continue;
    const blocked: number[] = [];
    if (rules.blocked) {
      // Trim endpoints of a covering path: the remaining induced board stays solvable.
      const count = 2 + Math.floor(rng() * (size - 2));
      const front = 1 + Math.floor(rng() * (count - 1));
      blocked.push(...path.slice(0, front), ...path.slice(path.length - (count - front)));
      path = path.slice(front, path.length - (count - front));
    }
    const p: PathPuzzle = { id: hash(`${seed}:${difficulty}:${variation}:${version}`), seed, generatorVersion: version,
      rows: size, cols: size, difficulty, variation, blockedCells: blocked.map(i => positionOf(i, size)), walls: [],
      checkpoints: [], solution: path.map(i => positionOf(i, size)), difficultyScore: 0 };
    if (version >= 2) p.finishAtLastCheckpoint = true;
    if (rules.walls) {
      const solutionEdges = new Set(path.slice(1).map((cell, i) => edgeKey(path[i], cell)));
      graph(p).forEach((neighbors, cell) => neighbors.forEach(next => {
        if (next > cell && !solutionEdges.has(edgeKey(cell, next)) && rng() < .38)
          p.walls.push({ from: positionOf(cell, size), to: positionOf(next, size) });
      }));
    }
    // Begin with a certified constrained board, then remove clues only after a
    // complete uniqueness proof. No budget-exhausted result is accepted.
    const indices = new Set(path.map((_, i) => i));
    const update = () => { p.checkpoints = [...indices].sort((a, b) => a - b).map((i, n) => ({ number: n + 1, position: positionOf(path[i], size) })); };
    const order = path.map((_, i) => i).slice(1, version >= 2 ? -1 : undefined);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const target = Math.max(3, Math.ceil(path.length * profile.density * (rules.sparse ? .6 : 1)));
    let branches = 0;
    for (const i of order) {
      if (indices.size <= target) break;
      indices.delete(i); update();
      const solved = yield* solveSteps(p, 2, options.maxNodes ?? 16000);
      if (solved.exhausted || solved.count !== 1) indices.add(i);
      else branches = solved.branches;
      yield;
    }
    update();
    // Keep profiles meaningful even when clues cannot be reduced to the target.
    if (indices.size > Math.ceil(path.length * (rules.sparse ? .32 : .55))) continue;
    const proof = yield* solveSteps(p, 2, options.maxNodes ?? 16000);
    if (proof.exhausted || proof.count !== 1) continue;
    p.difficultyScore = difficultyScore(p, Math.max(branches, proof.branches));
    if (classifyDifficulty(p.difficultyScore) !== difficulty) continue;
    if (!validatePuzzle(p)) continue;
    return p;
  }
  throw new Error('Could not certify a puzzle within the generation budget. Please try another seed.');
}
export const generatePuzzle = (options: GenerateOptions, signal?: AbortSignal) => runSteps(generateSteps(options), signal);
export function generatePuzzleSync(options: GenerateOptions) {
  const steps = generateSteps(options); let next = steps.next(); while (!next.done) next = steps.next(); return next.value;
}
