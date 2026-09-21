import { PathPuzzle, indexOf } from './types';
import { move } from './validator';
export type StrokePoint = { x: number; y: number };
/** Visits cells intersected by the actual pointer segment, including coalesced samples.
 * Exact corner crossings remain diagonal attempts and are rejected by the rules. */
export function crossedCells(from: StrokePoint, to: StrokePoint, cols: number, cellSize: number): number[] {
  const x = from.x / cellSize, y = from.y / cellSize;
  const dx = (to.x - from.x) / cellSize, dy = (to.y - from.y) / cellSize;
  let col = Math.floor(x), row = Math.floor(y);
  const endCol = Math.floor(to.x / cellSize), endRow = Math.floor(to.y / cellSize);
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const deltaX = dx ? 1 / Math.abs(dx) : Infinity, deltaY = dy ? 1 / Math.abs(dy) : Infinity;
  let edgeX = dx ? (col + (dx > 0 ? 1 : 0) - x) / dx : Infinity;
  let edgeY = dy ? (row + (dy > 0 ? 1 : 0) - y) / dy : Infinity;
  const cells: number[] = [];
  const steps = Math.abs(endCol - col) + Math.abs(endRow - row);
  for (let i = 0; i < steps && (col !== endCol || row !== endRow); i++) {
    if (Math.abs(edgeX - edgeY) < 1e-7) {
      cells.push((row + sy) * cols + col + sx); return cells;
    }
    if (edgeX < edgeY) { col += sx; edgeX += deltaX; }
    else { row += sy; edgeY += deltaY; }
    cells.push(row * cols + col);
  }
  return cells;
}
/** Owns one gesture's path so rapid samples never depend on a React render. */
export class PathStroke {
  private puzzle: PathPuzzle | null = null;
  private path: number[] = [];
  private previous: StrokePoint | null = null;
  private size = 0;
  get active() { return this.puzzle !== null; }
  preview(point: StrokePoint) {
    const p = this.puzzle;
    if (!p || !this.previous || !this.path.length || this.cell(point) !== this.path[this.path.length - 1]) return null;
    const cell = this.path[this.path.length - 1];
    return { from: { x: (cell % p.cols + .5) * this.size, y: (Math.floor(cell / p.cols) + .5) * this.size }, to: point };
  }
  private cell(point: StrokePoint) {
    const p = this.puzzle;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !p || this.size <= 0 || point.x < 0 || point.y < 0 || point.x >= p.cols * this.size || point.y >= p.rows * this.size) return -1;
    return Math.floor(point.y / this.size) * p.cols + Math.floor(point.x / this.size);
  }
  begin(puzzle: PathPuzzle, path: number[], point: StrokePoint, width: number) {
    this.puzzle = puzzle; this.path = [...path]; this.size = width / puzzle.cols; this.previous = null;
    const cell = this.cell(point), start = path.length ? path[path.length - 1] : indexOf(puzzle.checkpoints[0].position, puzzle.cols);
    if (cell !== start) { this.end(); return []; }
    this.previous = point;
    if (!path.length) { this.path = [cell]; return [cell]; }
    return [];
  }
  update(point: StrokePoint) {
    const p = this.puzzle; if (!p) return [];
    const cell = this.cell(point);
    if (cell < 0) { this.previous = null; return []; }
    if (!this.previous) {
      if (cell === this.path[this.path.length - 1]) this.previous = point;
      return [];
    }
    const candidates = crossedCells(this.previous, point, p.cols, this.size), entered: number[] = [];
    this.previous = point;
    for (const candidate of candidates) {
      if (candidate === this.path[this.path.length - 1]) continue;
      const result = move(p, this.path, candidate);
      entered.push(candidate);
      if (!result.valid) { this.previous = null; break; }
      this.path = result.path;
    }
    return entered;
  }
  end() { this.puzzle = null; this.previous = null; }
}
