import { Game, Stats, emptyStats } from './game';
import { Difficulty, Variation, difficulties, variations, PathPuzzle, indexOf } from '../engine/types';
import { isComplete, validPath, validatePuzzle } from '../engine/validator';
export type SavedState = { version: 1; game: Game | null; stats: Stats; recent: string[]; difficulty: Difficulty; variation: Variation | 'random' };
export const emptyState = (): SavedState => ({ version: 1, game: null, stats: emptyStats(), recent: [], difficulty: 'medium', variation: 'random' });
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function decodeState(raw: string | null): SavedState {
  if (!raw) return emptyState();
  try {
    const data: SavedState = JSON.parse(raw);
    if (data.version !== 1 || !difficulties.includes(data.difficulty) || ![...variations, 'random'].includes(data.variation)) throw Error('Invalid preferences');
    if (!Array.isArray(data.recent) || !data.recent.every(v => typeof v === 'string')) throw Error('Invalid history');
    const s = data.stats;
    if (!s || ![s.played, s.solved, s.totalTime, s.hints, s.streak].every(finite) || typeof s.lastDay !== 'string' || !Array.isArray(s.completedAttempts) || !s.completedAttempts.every(v => typeof v === 'string') || !s.best || !Object.values(s.best).every(finite)) throw Error('Invalid stats');
    if (data.game) {
      const g = data.game, p: PathPuzzle = g.puzzle;
      if (!p || ![1, 2].includes(p.generatorVersion) || !Number.isInteger(p.rows) || !Number.isInteger(p.cols) || p.rows < 2 || p.cols < 2 || p.rows > 12 || p.cols > 12 || !difficulties.includes(p.difficulty) || !variations.includes(p.variation)) throw Error('Invalid puzzle');
      if (typeof p.seed !== 'string' || typeof p.id !== 'string' || !finite(p.difficultyScore) || !Array.isArray(p.solution) || !Array.isArray(p.checkpoints) || !p.checkpoints.length || !Array.isArray(p.blockedCells) || !Array.isArray(p.walls)) throw Error('Invalid puzzle data');
      if (p.generatorVersion === 2 && p.finishAtLastCheckpoint !== true) throw Error('Invalid finish rule');
      if (!validatePuzzle(p)) throw Error('Invalid solution');
      if (!Array.isArray(g.path) || !validPath(p, g.path) || ![g.elapsed, g.moves, g.mistakes, g.hints].every(finite) || typeof g.started !== 'boolean' || typeof g.attemptId !== 'string' || g.completed !== isComplete(p, g.path)) throw Error('Invalid saved game');
    }
    // Retire legacy boards with an unnumbered tail without deleting statistics/preferences.
    if (data.game) {
      const p = data.game.puzzle;
      if (indexOf(p.solution[p.solution.length - 1], p.cols) !== indexOf(p.checkpoints[p.checkpoints.length - 1].position, p.cols)) data.game = null;
    }
    return { ...data, recent: data.recent.slice(-100) };
  } catch { return emptyState(); }
}
