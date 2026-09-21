import { INITIAL_POWER, MAX_POWER, MOMENTUM, ROLLING_WINDOW_MS, TAP_BUFFER_SIZE, TAP_POWER } from './config';
import { MatchSnapshot, MatchStatus, Player } from './types';
class TapMeter {
  private times = new Float64Array(TAP_BUFFER_SIZE);
  private head = 0;
  private length = 0;
  taps = 0;
  peak = 0;
  highSince: number | null = null;
  rolling(time: number) {
    while (this.length && this.times[this.head] <= time - ROLLING_WINDOW_MS) {
      this.head = (this.head + 1) % TAP_BUFFER_SIZE; this.length--;
    }
    return this.length * 1000 / ROLLING_WINDOW_MS;
  }
  add(time: number) {
    const before = this.rolling(time);
    if (before < MOMENTUM.boostTPS) this.highSince = null;
    if (this.length === TAP_BUFFER_SIZE) { this.head = (this.head + 1) % TAP_BUFFER_SIZE; this.length--; }
    this.times[(this.head + this.length) % TAP_BUFFER_SIZE] = time; this.length++; this.taps++;
    const rate = this.rolling(time); this.peak = Math.max(this.peak, rate);
    if (rate >= MOMENTUM.boostTPS && this.highSince === null) this.highSince = time;
  }
}
/** Authoritative synchronous state. No React updates or timers live here. */
export class TapClashEngine {
  private status: MatchStatus = 'idle';
  private bluePower = INITIAL_POWER;
  private meters = { red: new TapMeter(), blue: new TapMeter() };
  private elapsed = 0;
  private resumedAt = 0;
  private lastTimestamp = 0;
  private winner: Player | null = null;
  constructor(private momentum: boolean = MOMENTUM.enabled) {}
  reset(momentum = this.momentum) {
    this.momentum = momentum; this.status = 'idle'; this.bluePower = INITIAL_POWER;
    this.meters = { red: new TapMeter(), blue: new TapMeter() };
    this.elapsed = 0; this.resumedAt = 0; this.lastTimestamp = 0; this.winner = null;
  }
  start(timestamp: number) {
    if (this.status !== 'idle' || !Number.isFinite(timestamp)) return false;
    this.status = 'running'; this.resumedAt = timestamp; this.lastTimestamp = timestamp; return true;
  }
  private time(timestamp: number) {
    return this.elapsed + (this.status === 'running' ? Math.max(0, timestamp - this.resumedAt) : 0);
  }
  /** One native changedTouches batch is resolved together, without player ordering bias. */
  tapBatch(players: readonly Player[], timestamp: number) {
    if (this.status !== 'running' || !Number.isFinite(timestamp) || timestamp < this.lastTimestamp || !players.length) return false;
    this.lastTimestamp = timestamp;
    const time = this.time(timestamp); let delta = 0;
    for (const player of players) {
      const meter = this.meters[player]; meter.add(time);
      const boosted = this.momentum && meter.highSince !== null && time - meter.highSince >= MOMENTUM.sustainMs;
      delta += (player === 'blue' ? 1 : -1) * TAP_POWER * (boosted ? MOMENTUM.multiplier : 1);
    }
    this.bluePower = Math.max(0, Math.min(MAX_POWER, this.bluePower + delta));
    if (this.bluePower === 0 || this.bluePower === MAX_POWER) {
      this.winner = this.bluePower === MAX_POWER ? 'blue' : 'red';
      this.elapsed = time; this.status = 'finished';
    }
    return true;
  }
  redTap(timestamp: number) { return this.tapBatch(['red'], timestamp); }
  blueTap(timestamp: number) { return this.tapBatch(['blue'], timestamp); }
  pause(timestamp: number) {
    if (this.status !== 'running') return;
    this.elapsed = this.time(Math.max(timestamp, this.lastTimestamp)); this.status = 'paused';
  }
  resume(timestamp: number) {
    if (this.status !== 'paused' || !Number.isFinite(timestamp)) return;
    this.resumedAt = timestamp; this.lastTimestamp = timestamp; this.status = 'running';
  }
  getSnapshot(timestamp: number): MatchSnapshot {
    const elapsed = this.time(Math.max(timestamp, this.lastTimestamp));
    const metrics = (player: Player) => {
      const m = this.meters[player];
      return { taps: m.taps, rollingTPS: m.rolling(elapsed), averageTPS: elapsed > 0 ? m.taps * 1000 / elapsed : 0, peakTPS: m.peak };
    };
    return { status: this.status, bluePower: this.bluePower, redPower: MAX_POWER - this.bluePower, winner: this.winner, elapsed, red: metrics('red'), blue: metrics('blue') };
  }
}
