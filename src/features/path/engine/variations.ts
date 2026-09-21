import { Difficulty, Variation } from './types';
export const profiles: Record<Difficulty, { size: number; density: number; minTurns: number }> = {
  easy: { size: 5, density: .48, minTurns: .2 }, medium: { size: 6, density: .34, minTurns: .3 },
  hard: { size: 7, density: .24, minTurns: .4 }, expert: { size: 8, density: .17, minTurns: .45 },
};
export const variationRules = (v: Variation) => ({ walls: v === 'walls' || v === 'mixed', blocked: v === 'blocked' || v === 'mixed', sparse: v === 'sparse', turns: v === 'turns' || v === 'mixed' });
