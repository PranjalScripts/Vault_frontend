import { Difficulty } from './types';
import { GENERATOR_VERSION } from './generator';
export function dailySeed(difficulty: Difficulty, date = new Date()) {
  return `path-daily-${date.toISOString().slice(0, 10)}-${difficulty}-v${GENERATOR_VERSION}`;
}
