import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { getAuthUser } from '@/api/api';
import { generatePuzzle } from '../engine/generator';
import { dailySeed } from '../engine/daily';
import { fingerprint } from '../engine/fingerprint';
import { Difficulty, Variation } from '../engine/types';
import { advanceTimer, applyMove, hintFor, newGame, recordCompletion } from './game';
import { emptyState, loadState, SavedState, saveState } from './storage';
export function usePathGame() {
  const [state, setState] = useState<SavedState>(emptyState), ref = useRef(state);
  const [ready, setReady] = useState(false), [generating, setGenerating] = useState(false), [error, setError] = useState('');
  const [hint, setHint] = useState<{ cell: number; backtrack: boolean } | null>(null);
  const [invalidCell, setInvalidCell] = useState<number | null>(null);
  const lastSaved = useRef('');
  const owner = useRef(''), active = useRef(false), focused = useRef(false), clock = useRef<number | null>(null);
  const generation = useRef<AbortController | null>(null), mounted = useRef(true), saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = useCallback((next: SavedState) => { ref.current = next; if (mounted.current) setState(next); }, []);
  const accountTime = useCallback(() => {
    const result = advanceTimer(ref.current.game, clock.current, performance.now(), active.current);
    if (result.game !== ref.current.game) ref.current = { ...ref.current, game: result.game };
    clock.current = result.clock;
  }, []);
  const persist = useCallback(() => {
    if (!owner.current) return;
    accountTime();
    const serialized = JSON.stringify(ref.current);
    if (serialized === lastSaved.current) return;
    lastSaved.current = serialized;
    void saveState(owner.current, ref.current).catch(() => { lastSaved.current = ''; if (mounted.current) setError('Progress could not be saved on this device.'); });
  }, [accountTime]);
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try {
        const user: { _id?: string; id?: string } | null = await getAuthUser();
        const id = user?._id ?? user?.id;
        if (!id) throw Error('Sign in again to save your games.');
        const saved = await loadState(id);
        if (!mounted.current) return;
        owner.current = id; lastSaved.current = JSON.stringify(saved); clock.current = active.current ? performance.now() : null; commit(saved); setReady(true);
      } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Could not load saved game.'); }
    })();
    return () => { mounted.current = false; generation.current?.abort(); if (saveTimer.current) clearTimeout(saveTimer.current); persist(); };
  }, [commit, persist]);
  useFocusEffect(useCallback(() => {
    focused.current = true; active.current = AppState.currentState === 'active' && (typeof document === 'undefined' || !document.hidden); clock.current = performance.now();
    let cancelled = false;
    if (owner.current) {
      setReady(false);
      void loadState(owner.current).then(saved => {
        if (cancelled || !mounted.current) return;
        lastSaved.current = JSON.stringify(saved); clock.current = active.current ? performance.now() : null; commit(saved); setReady(true);
      }).catch(() => { if (!cancelled && mounted.current) { setError('Saved progress could not be refreshed.'); setReady(true); } });
    }
    return () => { cancelled = true; if (saveTimer.current) clearTimeout(saveTimer.current); accountTime(); focused.current = false; active.current = false; clock.current = null; generation.current?.abort(); persist(); };
  }, [accountTime, commit, persist]));
  useEffect(() => {
    const visibility = () => { accountTime(); active.current = focused.current && AppState.currentState === 'active' && (typeof document === 'undefined' || !document.hidden); clock.current = active.current ? performance.now() : null; if (!active.current) persist(); };
    const subscription = AppState.addEventListener('change', visibility);
    if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof document.addEventListener === 'function') document.addEventListener('visibilitychange', visibility);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('pagehide', persist);
    const interval = setInterval(() => { accountTime(); if (active.current && ref.current.game?.started && !ref.current.game.completed) commit({ ...ref.current }); }, 500);
    const checkpoint = setInterval(() => { if (active.current) persist(); }, 5000);
    return () => { subscription.remove(); clearInterval(interval); clearInterval(checkpoint); if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof document.removeEventListener === 'function') document.removeEventListener('visibilitychange', visibility); if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('pagehide', persist); };
  }, [accountTime, commit, persist]);
  const changed = useCallback((next: SavedState) => {
    commit(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 200);
  }, [commit, persist]);
  const start = async (difficulty: Difficulty, variation: Variation | 'random', daily = false) => {
    generation.current?.abort(); const controller = new AbortController(); generation.current = controller;
    setGenerating(true); setError('');
    try {
      let puzzle;
      for (let retry = 0; retry < 8; retry++) {
        const seed = daily ? dailySeed(difficulty) : `path-${new Date().toISOString().slice(0, 10)}-${Crypto.randomUUID()}`;
        puzzle = await generatePuzzle({ seed, difficulty, variation: daily ? 'classic' : variation }, controller.signal);
        if (daily || !ref.current.recent.includes(fingerprint(puzzle))) break;
        puzzle = undefined;
      }
      if (!puzzle) throw Error('Please try again for a fresh puzzle.');
      if (controller.signal.aborted || !mounted.current) return;
      const next = { ...ref.current, difficulty, variation, game: newGame(puzzle, Crypto.randomUUID()), recent: [...ref.current.recent, fingerprint(puzzle)].slice(-100), stats: { ...ref.current.stats, played: ref.current.stats.played + 1 } };
      clock.current = null; changed(next); setHint(null); setInvalidCell(null); persist();
    } catch (e) { if (!controller.signal.aborted && mounted.current) setError(e instanceof Error ? e.message : 'Generation failed. Try again.'); }
    finally { if (mounted.current && generation.current === controller) setGenerating(false); }
  };
  const enterCells = (cells: number[]) => {
    if (generating || !ref.current.game || !cells.length) return;
    accountTime();
    let updated = ref.current.game, invalid: number | null = null;
    for (const cell of cells) {
      const result = applyMove(updated, cell); updated = result.game;
      if (result.invalid) { invalid = cell; break; }
      if (updated.completed) break;
    }
    if (updated === ref.current.game) return;
    let next = { ...ref.current, game: updated };
    if (updated.completed) next = { ...next, stats: recordCompletion(next.stats, updated, new Date().toISOString().slice(0, 10)) };
    changed(next); clock.current = active.current && !updated.completed ? performance.now() : null;
    setHint(null); setInvalidCell(invalid);
    if (updated.completed) persist();
  };
  const undo = () => {
    accountTime(); const game = ref.current.game; if (!game || game.completed || !game.path.length) return;
    changed({ ...ref.current, game: { ...game, path: game.path.slice(0, -1), moves: game.moves + 1 } }); setHint(null);
  };
  const replay = () => {
    const game = ref.current.game; if (!game) return;
    changed({ ...ref.current, game: newGame(game.puzzle, Crypto.randomUUID()), stats: { ...ref.current.stats, played: ref.current.stats.played + 1 } }); clock.current = null; setHint(null); setInvalidCell(null);
  };
  const requestHint = () => {
    const game = ref.current.game; if (!game || game.completed) return;
    setInvalidCell(null); setHint(hintFor(game)); changed({ ...ref.current, game: { ...game, hints: game.hints + 1 }, stats: { ...ref.current.stats, hints: ref.current.stats.hints + 1 } });
  };
  return { state, ready, generating, error, hint, invalidCell, start, enterCells, undo, replay, requestHint, cancel: () => generation.current?.abort() };
}
