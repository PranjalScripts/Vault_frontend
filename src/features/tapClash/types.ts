export type Player = 'red' | 'blue';
export type Mode = 'computer' | 'local';
export const levels = ['basic', 'medium', 'hard'] as const;
export type Difficulty = typeof levels[number];
export type MatchStatus = 'idle' | 'running' | 'paused' | 'finished';
export type PlayerMetrics = { taps: number; rollingTPS: number; averageTPS: number; peakTPS: number };
export type MatchSnapshot = {
  status: MatchStatus; redPower: number; bluePower: number; elapsed: number;
  winner: Player | null; red: PlayerMetrics; blue: PlayerMetrics;
};
export type MatchResult = MatchSnapshot & { id: string; mode: Mode; difficulty: Difficulty };
export type Preferences = { sound: boolean; haptics: boolean; momentum: boolean; difficulty: Difficulty };
