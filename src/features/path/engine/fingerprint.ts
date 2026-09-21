import { PathPuzzle, Position } from './types';
import { hash } from './rng';
export function fingerprint(p: PathPuzzle) {
  const forms: string[] = [];
  for (let flip = 0; flip < 2; flip++) for (let rotation = 0; rotation < 4; rotation++) {
    const transform = (point: Position) => {
      let r = point.row, c = flip ? p.cols - 1 - point.col : point.col, rows = p.rows, cols = p.cols;
      for (let i = 0; i < rotation; i++) { [r, c] = [c, rows - 1 - r]; [rows, cols] = [cols, rows]; }
      return `${r},${c}`;
    };
    forms.push(JSON.stringify([!!p.finishAtLastCheckpoint, rotation % 2 ? [p.cols, p.rows] : [p.rows, p.cols],
      p.checkpoints.map(c => [c.number, transform(c.position)]), p.blockedCells.map(transform).sort(),
      p.walls.map(w => [transform(w.from), transform(w.to)].sort().join(':')).sort()]));
  }
  return hash(forms.sort()[0]);
}
