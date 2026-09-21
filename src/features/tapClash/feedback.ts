import { Platform } from 'react-native';
import type { AudioPlayer } from 'expo-audio';
import { FEEDBACK } from './config';
import { Preferences } from './types';
type Cue = 'countdown' | 'tap' | 'pressure' | 'victory' | 'complete';
const sources: Record<Cue, number> = {
  countdown: require('@/assets/sounds/tap-clash/countdown.wav'), tap: require('@/assets/sounds/tap-clash/tap.wav'),
  pressure: require('@/assets/sounds/tap-clash/pressure.wav'), victory: require('@/assets/sounds/tap-clash/victory.wav'), complete: require('@/assets/sounds/tap-clash/complete.wav'),
};
/** A fixed player pool and throttles prevent sound/haptic queues during rapid input. */
export class ClashFeedback {
  private players: Partial<Record<Cue, AudioPlayer>> = {};
  private busy = new Set<Cue>();
  private initialized: Promise<void> | null = null;
  private revision = 0;
  private disposed = false;
  private lastSound = -Infinity;
  private lastHaptic = -Infinity;
  private lastPressure = -Infinity;
  constructor(private preferences: Preferences) {}
  configure(preferences: Preferences) { this.preferences = preferences; if (!preferences.sound) this.stop(); }
  prepare() {
    if (!this.initialized) this.initialized = (async () => {
      try {
        const audio = await import('expo-audio');
        if (this.disposed) return;
        await audio.setAudioModeAsync({ allowsRecording: false, shouldPlayInBackground: false, playsInSilentMode: false });
        if (this.disposed) return;
        for (const cue of Object.keys(sources) as Cue[]) {
          const player = audio.createAudioPlayer(sources[cue]); player.volume = cue === 'tap' ? .3 : .5; this.players[cue] = player;
        }
      } catch { /* Older native binaries can still play the game without audio. */ }
    })();
    return this.initialized;
  }
  play(cue: Cue) {
    if (this.disposed || !this.preferences.sound || this.busy.has(cue)) return;
    const now = performance.now();
    if (cue === 'tap' && now - this.lastSound < FEEDBACK.tapSoundGap) return;
    if (cue === 'pressure' && now - this.lastPressure < FEEDBACK.pressureGap) return;
    if (cue === 'tap') this.lastSound = now;
    if (cue === 'pressure') this.lastPressure = now;
    const player = this.players[cue]; if (!player) return;
    this.busy.add(cue); const revision = this.revision;
    void player.seekTo(0).then(() => { if (!this.disposed && revision === this.revision && this.preferences.sound) player.play(); }).catch(() => {}).finally(() => this.busy.delete(cue));
  }
  haptic(kind: 'tap' | 'countdown' | 'finish') {
    if (this.disposed || !this.preferences.haptics || Platform.OS === 'web') return;
    const now = performance.now();
    if (kind === 'tap' && now - this.lastHaptic < FEEDBACK.tapHapticGap) return;
    this.lastHaptic = now; const revision = this.revision;
    void import('expo-haptics').then(haptics => {
      if (this.disposed || revision !== this.revision || !this.preferences.haptics) return;
      return Platform.OS === 'android'
        ? haptics.performAndroidHapticsAsync(kind === 'finish' ? haptics.AndroidHaptics.Confirm : haptics.AndroidHaptics.Clock_Tick)
        : kind === 'finish' ? haptics.notificationAsync(haptics.NotificationFeedbackType.Success) : haptics.selectionAsync();
    }).catch(() => {});
  }
  stop() { this.revision++; for (const player of Object.values(this.players)) { try { player?.pause(); } catch {} } }
  dispose() { this.disposed = true; this.stop(); for (const player of Object.values(this.players)) { try { player?.remove(); } catch {} } this.players = {}; }
}
