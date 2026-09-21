import { PathPuzzle, indexOf } from '../engine/types';
import { isComplete, move } from '../engine/validator';
export type Game = { puzzle: PathPuzzle; path: number[]; elapsed: number; started: boolean; moves: number; mistakes: number; hints: number; completed: boolean; attemptId: string };
export type Stats = { played: number; solved: number; totalTime: number; hints: number; streak: number; lastDay: string; best: Partial<Record<PathPuzzle['difficulty'], number>>; completedAttempts: string[] };
export const emptyStats = (): Stats => ({ played: 0, solved: 0, totalTime: 0, hints: 0, streak: 0, lastDay: '', best: {}, completedAttempts: [] });
export function newGame(puzzle: PathPuzzle, attemptId: string): Game {
  return { puzzle, path: [], elapsed: 0, started: false, moves: 0, mistakes: 0, hints: 0, completed: false, attemptId };
}
export function applyMove(game: Game, cell: number): { game: Game; invalid: boolean } {
  if (game.completed || game.path[game.path.length - 1] === cell) return { game, invalid: false };
  const result = move(game.puzzle, game.path, cell);
  if (!result.valid) return { game: { ...game, mistakes: game.mistakes + 1 }, invalid: true };
  return { game: { ...game, path: result.path, started: true, moves: game.moves + 1, completed: isComplete(game.puzzle, result.path) }, invalid: false };
}
export function hintFor(game: Game): { cell: number; backtrack: boolean } {
  const solution = game.puzzle.solution.map(c => indexOf(c, game.puzzle.cols));
  const mismatch = game.path.findIndex((cell, i) => cell !== solution[i]);
  return mismatch >= 0 ? { cell: game.path[Math.max(0, mismatch - 1)], backtrack: true }
    : { cell: solution[Math.min(game.path.length, solution.length - 1)], backtrack: false };
}
export function recordCompletion(stats: Stats, game: Game, day: string): Stats {
  if (!game.completed || !isComplete(game.puzzle, game.path) || stats.completedAttempts.includes(game.attemptId)) return stats;
  const yesterday = new Date(`${day}T00:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return { ...stats, solved: stats.solved + 1, totalTime: stats.totalTime + game.elapsed,
    best: { ...stats.best, [game.puzzle.difficulty]: Math.min(stats.best[game.puzzle.difficulty] ?? Infinity, game.elapsed) },
    streak: stats.lastDay === day ? stats.streak : stats.lastDay === yesterday.toISOString().slice(0, 10) ? stats.streak + 1 : 1,
    lastDay: day, completedAttempts: [...stats.completedAttempts.slice(-199), game.attemptId] };
}
export function currentStreak(stats: Stats, day: string) {
  const yesterday = new Date(`${day}T00:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return stats.lastDay === day || stats.lastDay === yesterday.toISOString().slice(0, 10) ? stats.streak : 0;
}
export function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
/** Accumulate the preceding active interval; the next interval starts only while active. */
export function advanceTimer(game: Game | null, previous: number | null, now: number, active: boolean) {
  const running = game?.started && !game.completed;
  return {
    game: game && running && previous !== null ? { ...game, elapsed: game.elapsed + Math.max(0, now - previous) } : game,
    clock: active && running ? now : null,
  };
}
