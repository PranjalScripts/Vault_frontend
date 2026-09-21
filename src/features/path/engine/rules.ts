import { indexOf, PathPuzzle } from './types';
export const edgeKey = (a: number, b: number) => a < b ? `${a}:${b}` : `${b}:${a}`;
export function graph(p: PathPuzzle) {
  const blocked = new Set(p.blockedCells.map(c => indexOf(c, p.cols)));
  const walls = new Set(p.walls.map(w => edgeKey(indexOf(w.from, p.cols), indexOf(w.to, p.cols))));
  return Array.from({ length: p.rows * p.cols }, (_, i) => blocked.has(i) ? [] :
    [i - p.cols, i + p.cols, ...(i % p.cols ? [i - 1] : []), ...(i % p.cols < p.cols - 1 ? [i + 1] : [])]
      .filter(j => j >= 0 && j < p.rows * p.cols && !blocked.has(j) && !walls.has(edgeKey(i, j))));
}
