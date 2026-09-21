import { PathPuzzle, indexOf } from './types';
export function turnCount(path: number[], cols: number) {
  return path.slice(2).reduce((sum, cell, i) => sum + Number(cell - path[i + 1] !== path[i + 1] - path[i]), 0);
}
export function difficultyScore(p: PathPuzzle, branches: number) {
  const cells = p.solution.length;
  return Math.round((p.rows * p.cols - 25) * 1.4 + (1 - p.checkpoints.length / cells) * 30
    + turnCount(p.solution.map(c => indexOf(c, p.cols)), p.cols) / cells * 18
    + Math.min(15, Math.log2(1 + branches) * 1.5) + Math.min(5, p.walls.length * .2 + p.blockedCells.length * .5));
}
export const classifyDifficulty = (score: number) => score < 45 ? 'easy' : score < 68 ? 'medium' : score < 94 ? 'hard' : 'expert';
