import { Difficulty, MatchResult, Preferences, levels } from './types';
export type ClashStats = {
  computer: { played: number; wins: number; losses: number; winsByLevel: Record<Difficulty, number>; fastestVictory: number | null; highestAverageTPS: number; peakTPS: number; mostTaps: number };
  local: { played: number; redWins: number; blueWins: number; fastestMatch: number | null; longestMatch: number; highestTPS: number };
  recorded: string[];
};
export type StoredClash = { version: 1; preferences: Preferences; stats: ClashStats };
export const emptyClash = (): StoredClash => ({
  version: 1, preferences: { sound: false, haptics: true, momentum: false, difficulty: 'basic' },
  stats: {
    computer: { played: 0, wins: 0, losses: 0, winsByLevel: { basic: 0, medium: 0, hard: 0 }, fastestVictory: null, highestAverageTPS: 0, peakTPS: 0, mostTaps: 0 },
    local: { played: 0, redWins: 0, blueWins: 0, fastestMatch: null, longestMatch: 0, highestTPS: 0 }, recorded: [],
  },
});
export function recordMatch(stats: ClashStats, result: MatchResult): ClashStats {
  if (result.status !== 'finished' || !result.winner || stats.recorded.includes(result.id)) return stats;
  const next = { ...stats, recorded: [...stats.recorded.slice(-199), result.id] };
  if (result.mode === 'computer') {
    const s = stats.computer, won = result.winner === 'blue';
    next.computer = { ...s, played: s.played + 1, wins: s.wins + Number(won), losses: s.losses + Number(!won),
      winsByLevel: { ...s.winsByLevel, [result.difficulty]: s.winsByLevel[result.difficulty] + Number(won) },
      fastestVictory: won ? Math.min(s.fastestVictory ?? Infinity, result.elapsed) : s.fastestVictory,
      highestAverageTPS: Math.max(s.highestAverageTPS, result.blue.averageTPS), peakTPS: Math.max(s.peakTPS, result.blue.peakTPS), mostTaps: Math.max(s.mostTaps, result.blue.taps) };
  } else {
    const s = stats.local;
    next.local = { played: s.played + 1, redWins: s.redWins + Number(result.winner === 'red'), blueWins: s.blueWins + Number(result.winner === 'blue'),
      fastestMatch: Math.min(s.fastestMatch ?? Infinity, result.elapsed), longestMatch: Math.max(s.longestMatch, result.elapsed), highestTPS: Math.max(s.highestTPS, result.red.peakTPS, result.blue.peakTPS) };
  }
  return next;
}
export const winRate = (stats: ClashStats) => stats.computer.played ? stats.computer.wins / stats.computer.played * 100 : 0;
export function decodeClash(raw: string | null): StoredClash {
  try {
    if (!raw) return emptyClash();
    const data: StoredClash = JSON.parse(raw), prefs = data.preferences, stats = data.stats;
    const nonnegative = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
    if (data.version !== 1 || !prefs || !levels.includes(prefs.difficulty) || ![prefs.sound, prefs.haptics, prefs.momentum].every(v => typeof v === 'boolean')) throw Error('preferences');
    if (!stats || !stats.computer || !stats.local || !Array.isArray(stats.recorded) || !stats.recorded.every(v => typeof v === 'string')) throw Error('stats');
    const c = stats.computer, l = stats.local;
    if (![c.played, c.wins, c.losses, c.highestAverageTPS, c.peakTPS, c.mostTaps, l.played, l.redWins, l.blueWins, l.longestMatch, l.highestTPS].every(nonnegative)) throw Error('numbers');
    if ((c.fastestVictory !== null && !nonnegative(c.fastestVictory)) || (l.fastestMatch !== null && !nonnegative(l.fastestMatch)) || !c.winsByLevel || !levels.every(level => nonnegative(c.winsByLevel[level]))) throw Error('records');
    if (c.played !== c.wins + c.losses || l.played !== l.redWins + l.blueWins) throw Error('totals');
    return { ...data, stats: { ...stats, recorded: stats.recorded.slice(-200) } };
  } catch { return emptyClash(); }
}
