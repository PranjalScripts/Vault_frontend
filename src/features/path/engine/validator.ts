import { graph } from './rules';
import { indexOf, PathPuzzle } from './types';
export function move(p: PathPuzzle, path: number[], cell: number): { path: number[]; valid: boolean; undo?: boolean } {
  if (!Number.isInteger(cell) || cell < 0 || cell >= p.rows * p.cols || p.blockedCells.some(c => indexOf(c, p.cols) === cell)) return { path, valid: false };
  if (path.length > 1 && path[path.length - 2] === cell) return { path: path.slice(0, -1), valid: true, undo: true };
  if (path.includes(cell)) return { path, valid: false };
  const cp = p.checkpoints.find(c => indexOf(c.position, p.cols) === cell);
  if (p.finishAtLastCheckpoint && cp?.number === p.checkpoints.length && path.length !== p.rows * p.cols - p.blockedCells.length - 1) return { path, valid: false };
  const visited = p.checkpoints.filter(c => path.includes(indexOf(c.position, p.cols))).length;
  if ((!path.length && cp?.number !== 1) || (cp && cp.number !== visited + 1) || (path.length > 0 && !graph(p)[path[path.length - 1]].includes(cell))) return { path, valid: false };
  return { path: [...path, cell], valid: true };
}
export function validPath(p: PathPuzzle, path: number[]) {
  let prefix: number[] = [];
  for (const cell of path) {
    const result = move(p, prefix, cell);
    if (!result.valid || result.undo) return false;
    prefix = result.path;
  }
  return true;
}
export function isComplete(p: PathPuzzle, path: number[]) {
  const blocked = new Set(p.blockedCells.map(c => indexOf(c, p.cols)));
  const visited = new Set(path);
  if (path.length !== p.rows * p.cols - blocked.size || visited.size !== path.length || !validPath(p, path)) return false;
  for (let cell = 0; cell < p.rows * p.cols; cell++) if (!blocked.has(cell) && !visited.has(cell)) return false;
  if (p.finishAtLastCheckpoint && path[path.length - 1] !== indexOf(p.checkpoints[p.checkpoints.length - 1].position, p.cols)) return false;
  return p.checkpoints.every(c => visited.has(indexOf(c.position, p.cols)));
}
export function validatePuzzle(p: PathPuzzle): boolean {
  const inBounds = (c: { row: number; col: number }) => c && Number.isInteger(c.row) && Number.isInteger(c.col) && c.row >= 0 && c.row < p.rows && c.col >= 0 && c.col < p.cols;
  if (!p.checkpoints.length || !p.solution.every(inBounds) || !p.blockedCells.every(inBounds) || !p.checkpoints.every((c, i) => c.number === i + 1 && inBounds(c.position))) return false;
  const blocked = p.blockedCells.map(c => indexOf(c, p.cols));
  const checkpoints = p.checkpoints.map(c => indexOf(c.position, p.cols));
  if (new Set(blocked).size !== blocked.length || new Set(checkpoints).size !== checkpoints.length || checkpoints.some(c => blocked.includes(c))) return false;
  if (!p.walls.every(w => inBounds(w.from) && inBounds(w.to) && Math.abs(w.from.row - w.to.row) + Math.abs(w.from.col - w.to.col) === 1)) return false;
  return isComplete(p, p.solution.map(c => indexOf(c, p.cols)));
}
