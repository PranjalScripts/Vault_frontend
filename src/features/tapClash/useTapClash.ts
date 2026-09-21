import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';
import { getAuthUser } from '@/api/api';
import { TapClashEngine } from './engine';
import { TapClashAI } from './ai';
import { randomFor } from './random';
import { ClashFeedback } from './feedback';
import { COUNTDOWN_STEP_MS, DISPLAY_REFRESH_MS, TAKEOVER_MS } from './config';
import { MatchResult, Mode, Player, Preferences } from './types';
import { emptyClash, recordMatch, StoredClash } from './stats';
import { loadClash, saveClash } from './storage';
import { keyboardPlayer } from './input';
export type ClashPhase = 'menu' | 'level' | 'local' | 'stats' | 'countdown' | 'running' | 'paused' | 'takeover' | 'result';
export function useTapClash() {
  const engine = useRef(new TapClashEngine()), ai = useRef<TapClashAI | null>(null);
  const [data, setData] = useState<StoredClash>(emptyClash), stored = useRef(data);
  const [phase, setPhase] = useState<ClashPhase>('menu'), phaseRef = useRef<ClashPhase>('menu');
  const [mode, setMode] = useState<Mode>('computer'), modeRef = useRef<Mode>('computer');
  const [countdown, setCountdown] = useState(3), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState(() => engine.current.getSnapshot(0)), [result, setResult] = useState<MatchResult | null>(null);
  const owner = useRef(''), matchId = useRef(''), mounted = useRef(true), focused = useRef(false), resumedMatch = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedback = useRef<ClashFeedback | null>(null);
  const boundary = useSharedValue(.5), redPulse = useSharedValue(0), bluePulse = useSharedValue(0);
  const transition = useCallback((next: ClashPhase) => { phaseRef.current = next; if (mounted.current) setPhase(next); }, []);
  const clearTimer = useCallback(() => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; }, []);
  const persist = useCallback((next: StoredClash) => {
    stored.current = next; setData(next); feedback.current?.configure(next.preferences);
    if (owner.current) void saveClash(owner.current, next).catch(() => { if (mounted.current) setError('Stats could not be saved on this device.'); });
  }, []);
  useEffect(() => {
    mounted.current = true; let cancelled = false;
    feedback.current = new ClashFeedback(stored.current.preferences);
    void feedback.current.prepare();
    void (async () => {
      try {
        const user: { _id?: string; id?: string } | null = await getAuthUser(); const id = user?._id ?? user?.id;
        if (!id) throw Error('Sign in again to save your Tap Clash stats.');
        const saved = await loadClash(id); if (cancelled) return;
        owner.current = id; stored.current = saved; setData(saved); feedback.current?.configure(saved.preferences);
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Local stats are unavailable.'); }
      finally { if (!cancelled) setReady(true); }
    })();
    return () => { cancelled = true; mounted.current = false; ai.current?.stop(); clearTimer(); feedback.current?.dispose(); };
  }, [clearTimer]);
  const finish = useCallback((time: number) => {
    const final = engine.current.getSnapshot(time);
    if (final.status !== 'finished' || phaseRef.current !== 'running') return;
    ai.current?.stop(); clearTimer();
    const completed = { ...final, id: matchId.current, mode: modeRef.current, difficulty: stored.current.preferences.difficulty };
    setSnapshot(final); setResult(completed); transition('takeover');
    boundary.value = withTiming(final.redPower / 100, { duration: TAKEOVER_MS });
    feedback.current?.play(modeRef.current === 'local' || final.winner === 'blue' ? 'victory' : 'complete'); feedback.current?.haptic('finish');
    persist({ ...stored.current, stats: recordMatch(stored.current.stats, completed) });
    timer.current = setTimeout(() => { timer.current = null; transition('result'); }, TAKEOVER_MS);
  }, [boundary, clearTimer, persist, transition]);
  const tap = useCallback((players: readonly Player[], human = true) => {
    if (phaseRef.current !== 'running' || !focused.current || AppState.currentState !== 'active') return false;
    const time = performance.now();
    const accepted = engine.current.tapBatch(players, time); if (!accepted) return false;
    const next = engine.current.getSnapshot(time);
    boundary.value = withTiming(next.redPower / 100, { duration: 80 });
    if (players.includes('red')) redPulse.value = withSequence(withTiming(.15, { duration: 25 }), withTiming(0, { duration: 180 }));
    if (players.includes('blue')) bluePulse.value = withSequence(withTiming(.15, { duration: 25 }), withTiming(0, { duration: 180 }));
    if (next.status === 'finished') finish(time);
    else {
      feedback.current?.play('tap'); if (human) feedback.current?.haptic('tap');
      if (Math.max(next.redPower, next.bluePower) > 85) feedback.current?.play('pressure');
    }
    return true;
  }, [bluePulse, boundary, finish, redPulse]);
  const pause = useCallback(() => {
    if (phaseRef.current === 'running') { engine.current.pause(performance.now()); ai.current?.pause(); resumedMatch.current = true; }
    else if (phaseRef.current === 'countdown') { clearTimer(); }
    else if (phaseRef.current === 'takeover') { clearTimer(); transition('result'); return; }
    else return;
    feedback.current?.stop(); setSnapshot(engine.current.getSnapshot(performance.now())); transition('paused');
  }, [clearTimer, transition]);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; pause(); ai.current?.pause(); feedback.current?.stop(); }; }, [pause]));
  useEffect(() => {
    const onBackground = () => { if (AppState.currentState !== 'active' || (typeof document !== 'undefined' && document.hidden)) pause(); };
    const subscription = AppState.addEventListener('change', onBackground);
    if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof document.addEventListener === 'function') document.addEventListener('visibilitychange', onBackground);
    return () => { subscription.remove(); if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof document.removeEventListener === 'function') document.removeEventListener('visibilitychange', onBackground); };
  }, [pause]);
  useEffect(() => {
    if (phase !== 'running') return;
    const interval = setInterval(() => setSnapshot(engine.current.getSnapshot(performance.now())), DISPLAY_REFRESH_MS);
    return () => clearInterval(interval);
  }, [phase]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.addEventListener !== 'function' || typeof window.removeEventListener !== 'function') return;
    const keydown = (event: KeyboardEvent) => {
      if (!focused.current || phaseRef.current !== 'running' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      const editable = target instanceof HTMLElement && (target.isContentEditable || !!target.closest('input,textarea,select,[role="textbox"]'));
      if (!editable && keyboardPlayer(event.key, modeRef.current, false, false)) event.preventDefault();
      const player = keyboardPlayer(event.key, modeRef.current, event.repeat, editable);
      if (player) { event.preventDefault(); tap([player]); }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [tap]);
  const beginCountdown = () => {
    clearTimer(); transition('countdown'); setCountdown(3); feedback.current?.play('countdown'); feedback.current?.haptic('countdown');
    let remaining = 3;
    const tick = () => {
      if (phaseRef.current !== 'countdown' || !focused.current) return;
      remaining--; setCountdown(remaining);
      if (remaining > 0) { feedback.current?.play('countdown'); feedback.current?.haptic('countdown'); timer.current = setTimeout(tick, COUNTDOWN_STEP_MS); return; }
      timer.current = null;
      const now = performance.now();
      if (resumedMatch.current) engine.current.resume(now); else engine.current.start(now);
      transition('running'); feedback.current?.haptic('countdown');
      if (modeRef.current === 'computer') {
        if (resumedMatch.current) ai.current?.resume();
        else {
          ai.current = new TapClashAI(stored.current.preferences.difficulty, randomFor(matchId.current), () => { tap(['red'], false); return phaseRef.current === 'running'; });
          ai.current.start();
        }
      }
      timer.current = setTimeout(() => { timer.current = null; if (mounted.current) setCountdown(-1); }, 450);
    };
    timer.current = setTimeout(tick, COUNTDOWN_STEP_MS);
  };
  const start = (nextMode: Mode) => {
    ai.current?.stop(); clearTimer(); feedback.current?.stop();
    modeRef.current = nextMode; setMode(nextMode); matchId.current = Crypto.randomUUID(); resumedMatch.current = false;
    engine.current.reset(stored.current.preferences.momentum); boundary.value = .5; redPulse.value = 0; bluePulse.value = 0;
    setSnapshot(engine.current.getSnapshot(0)); setResult(null); beginCountdown();
  };
  const menu = (next: 'menu' | 'level' | 'local' | 'stats') => { ai.current?.stop(); clearTimer(); feedback.current?.stop(); transition(next); };
  const preference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => persist({ ...stored.current, preferences: { ...stored.current.preferences, [key]: value } });
  return { phase, mode, data, ready, error, snapshot, result, countdown, boundary, redPulse, bluePulse, tap, pause, resume: beginCountdown, start, menu, preference };
}
