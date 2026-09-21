import { AI_DIFFICULTIES, MAX_AI_TPS } from './config';
import { Difficulty } from './types';
export type Scheduler = { now: () => number; schedule: (callback: () => void, delay: number) => () => void };
export const realScheduler: Scheduler = {
  now: () => performance.now(),
  schedule: (callback, delay) => { const timer = setTimeout(callback, delay); return () => clearTimeout(timer); },
};
export function nextTapDelay(difficulty: Difficulty, random: () => number) {
  const profile = AI_DIFFICULTIES[difficulty];
  let delay = 1000 / profile.baseTPS * (1 + (random() * 2 - 1) * profile.variance);
  const action = random();
  if (action < profile.pauseChance) delay *= profile.pauseMultiplier;
  else if (action < profile.pauseChance + profile.burstChance) delay /= profile.burstMultiplier;
  return Math.max(1000 / MAX_AI_TPS, delay);
}
/** Schedules one virtual tap at a time. Never catches up missed/background time. */
export class TapClashAI {
  private cancel: (() => void) | null = null;
  private running = false;
  private paused = false;
  private due = 0;
  private remaining = 0;
  constructor(private difficulty: Difficulty, private random: () => number, private onTap: (time: number) => boolean, private scheduler: Scheduler = realScheduler) {}
  start() {
    this.stop(); this.running = true;
    this.enqueue(AI_DIFFICULTIES[this.difficulty].reactionDelay);
  }
  private enqueue(delay: number) {
    this.due = this.scheduler.now() + delay;
    this.cancel = this.scheduler.schedule(() => {
      this.cancel = null;
      if (!this.running || this.paused) return;
      if (!this.onTap(this.scheduler.now())) { this.stop(); return; }
      if (this.running && !this.paused) this.enqueue(nextTapDelay(this.difficulty, this.random));
    }, delay);
  }
  pause() {
    if (!this.running || this.paused) return;
    this.remaining = Math.max(1000 / MAX_AI_TPS, this.due - this.scheduler.now());
    this.paused = true; this.cancel?.(); this.cancel = null;
  }
  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false; this.enqueue(this.remaining);
  }
  stop() { this.running = false; this.paused = false; this.cancel?.(); this.cancel = null; }
}
