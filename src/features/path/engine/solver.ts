import { graph } from './rules';
import { indexOf, PathPuzzle } from './types';
export type SolveResult = { count: number; exhausted: boolean; nodes: number; branches: number; forced: number; solution: number[] };
/** Resumable DFS. A yielded search retains its stack; callers may render or cancel. */
export function* solveSteps(p: PathPuzzle, maxSolutions = 2, maxNodes = 120000): Generator<void, SolveResult> {
  const adj = graph(p), total = p.rows * p.cols - p.blockedCells.length;
  const checkpoints = new Map(p.checkpoints.map(c => [indexOf(c.position, p.cols), c.number]));
  const start = p.checkpoints.find(c => c.number === 1);
  const result: SolveResult = { count: 0, exhausted: false, nodes: 0, branches: 0, forced: 0, solution: [] };
  if (!start) return result;
  const used = new Uint8Array(adj.length), path: number[] = [];
  const reachable = new Uint32Array(adj.length); let stamp = 0;
  function feasible(current: number) {
    stamp++;
    const queue = [current]; reachable[current] = stamp;
    let leaves = 0;
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head]; let degree = 0;
      for (const next of adj[cell]) if (!used[next] || next === current) {
        degree++;
        if (reachable[next] !== stamp) { reachable[next] = stamp; queue.push(next); }
      }
      if (cell !== current && degree === 0) return false;
      if (cell !== current && degree === 1 && ++leaves > 1) return false;
    }
    return queue.length === total - path.length + 1;
  }
  function* dfs(cell: number, expected: number): Generator<void> {
    if (result.count >= maxSolutions || result.exhausted) return;
    if (++result.nodes > maxNodes) { result.exhausted = true; return; }
    if (result.nodes % 128 === 0) yield;
    used[cell] = 1; path.push(cell);
    const cp = checkpoints.get(cell); const nextExpected = cp ? expected + 1 : expected;
    if (path.length === total) {
      if (nextExpected === p.checkpoints.length + 1) { result.count++; if (result.count === 1) result.solution = [...path]; }
    } else if (feasible(cell)) {
      const candidates = adj[cell].filter(n => !used[n] && (!checkpoints.has(n) || checkpoints.get(n) === nextExpected) && (!p.finishAtLastCheckpoint || checkpoints.get(n) !== p.checkpoints.length || path.length === total - 1));
      candidates.sort((a, b) => adj[a].filter(n => !used[n]).length - adj[b].filter(n => !used[n]).length);
      if (candidates.length === 1) result.forced++; else result.branches += Math.max(0, candidates.length - 1);
      for (const n of candidates) yield* dfs(n, nextExpected);
    }
    path.pop(); used[cell] = 0;
  }
  yield* dfs(indexOf(start.position, p.cols), 1);
  return result;
}
export function solvePuzzle(p: PathPuzzle, maxSolutions = 2, maxNodes = 120000) {
  const steps = solveSteps(p, maxSolutions, maxNodes); let next = steps.next();
  while (!next.done) next = steps.next();
  return next.value;
}
export async function runSteps<T>(steps: Generator<void, T>, signal?: AbortSignal, maxDurationMs = 15000): Promise<T> {
  let slice = Date.now(); const started = slice;
  while (true) {
    if (signal?.aborted) throw new Error('Generation cancelled');
    if (Date.now() - started > maxDurationMs) throw new Error('Generation took too long. Please try again.');
    const next = steps.next(); if (next.done) return next.value;
    if (Date.now() - slice >= 6) { await new Promise<void>(resolve => setTimeout(resolve, 0)); slice = Date.now(); }
  }
}
