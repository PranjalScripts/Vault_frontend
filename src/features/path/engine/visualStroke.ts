import type { StrokePoint } from './stroke';

/** One subpath, including the live endpoint. Safe to run as a UI-thread worklet. */
export function strokePath(cells: readonly number[], cols: number, cellSize: number, finger: StrokePoint | null): string {
  'worklet';
  if (!cells.length || cellSize <= 0) return '';
  const center = (cell: number) => ({ x: (cell % cols + .5) * cellSize, y: (Math.floor(cell / cols) + .5) * cellSize });
  let count = cells.length;
  if (finger && count > 1) {
    const previous = center(cells[count - 2]), last = center(cells[count - 1]);
    const dx = last.x - previous.x, dy = last.y - previous.y;
    // A cell is logically entered at its edge, before the finger reaches its
    // center. Don't draw ahead of the finger then double back. The same trim
    // retracts the stroke continuously while moving toward the previous cell.
    const progress = ((finger.x - previous.x) * dx + (finger.y - previous.y) * dy) / (dx * dx + dy * dy);
    if (progress < 1) count--;
  }
  const start = center(cells[0]);
  let d = `M ${start.x} ${start.y}`;
  for (let i = 1; i < count; i++) {
    const point = center(cells[i]);
    d += ` L ${point.x} ${point.y}`;
  }
  if (finger) d += ` L ${finger.x} ${finger.y}`;
  else if (count === 1) d += ` L ${start.x} ${start.y}`;
  return d;
}
