import { Difficulty } from './types';
export const INITIAL_POWER = 50;
export const MAX_POWER = 100;
export const TAP_POWER = 2;
export const ROLLING_WINDOW_MS = 1000;
export const TAP_BUFFER_SIZE = 512;
export const DISPLAY_REFRESH_MS = 100;
export const COUNTDOWN_STEP_MS = 1000;
export const TAKEOVER_MS = 420;
export const MAX_AI_TPS = 12;
export const MOMENTUM = { enabled: false, pressureTPS: 7, boostTPS: 9, sustainMs: 650, multiplier: 1.04 } as const;
export const FEEDBACK = { tapSoundGap: 90, tapHapticGap: 350, pressureGap: 1800, rippleMs: 240 } as const;
export const ARENA_COLORS = { red: '#A82E40', blue: '#185C9E', ink: '#FFFFFF', line: '#FFF2DE' } as const;
export type AIProfile = { baseTPS: number; variance: number; burstChance: number; burstMultiplier: number; pauseChance: number; pauseMultiplier: number; reactionDelay: number; minTPS: number; maxTPS: number };
export const AI_DIFFICULTIES: Record<Difficulty, AIProfile> = {
  basic: { baseTPS: 3.3, variance: .36, burstChance: .09, burstMultiplier: 1.45, pauseChance: .09, pauseMultiplier: 2.4, reactionDelay: 480, minTPS: 2.5, maxTPS: 3.5 },
  medium: { baseTPS: 5.5, variance: .2, burstChance: .09, burstMultiplier: 1.3, pauseChance: .035, pauseMultiplier: 1.9, reactionDelay: 300, minTPS: 4.5, maxTPS: 6 },
  hard: { baseTPS: 8.1, variance: .1, burstChance: .08, burstMultiplier: 1.18, pauseChance: .012, pauseMultiplier: 1.6, reactionDelay: 180, minTPS: 7, maxTPS: 9 },
};
