import { Mode, Player } from './types';
export type TouchPoint = { id: number; x: number; y: number };
/** Deduplicates held fingers; each new finger is handled independently. */
export class TouchTracker {
  private held = new Set<number>();
  down(points: readonly TouchPoint[], width: number, height: number, redFraction: number, mode: Mode) {
    const taps: { player: Player; x: number; y: number }[] = [];
    for (const point of points) {
      if (this.held.has(point.id)) continue;
      this.held.add(point.id);
      if (point.x < 0 || point.x > width || point.y < 0 || point.y > height) continue;
      const player = point.y < height * redFraction ? 'red' : 'blue';
      if (mode === 'local' || player === 'blue') taps.push({ player, x: point.x, y: point.y });
    }
    return taps;
  }
  up(ids: readonly number[]) { for (const id of ids) this.held.delete(id); }
  clear() { this.held.clear(); }
}
export function keyboardPlayer(key: string, mode: Mode, repeat: boolean, editable: boolean): Player | null {
  if (repeat || editable) return null;
  if (key === 'ArrowDown' || (mode === 'computer' && key === ' ')) return 'blue';
  return mode === 'local' && key.toLowerCase() === 'w' ? 'red' : null;
}
