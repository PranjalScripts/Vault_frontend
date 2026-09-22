import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { isAxiosError } from 'axios';
import { getAuthToken, getPuzzleAnswer, subscribeToAuthChanges } from '@/api/api';
import { PuzzleAnswer } from './puzzles';

export function usePuzzleAccess(id?: string) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [answer, setAnswer] = useState<PuzzleAnswer | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    let mounted = true, revision = 0;
    const update = (signedIn: boolean) => {
      revision++;
      request.current?.abort(); request.current = null;
      if (!mounted) return;
      setAuthenticated(signedIn); setAnswer(null); setLoading(false); setError('');
    };
    const refresh = () => {
      const currentRevision = revision;
      void getAuthToken().then(token => { if (mounted && currentRevision === revision) update(!!token); });
    };
    const unsubscribe = subscribeToAuthChanges(update);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const storage = (event: StorageEvent) => { if (!event.key || event.key === 'vault-auth-token') refresh(); };
    if (Platform.OS === 'web') window.addEventListener('storage', storage);
    refresh();
    return () => {
      mounted = false; request.current?.abort(); unsubscribe(); subscription.remove();
      if (Platform.OS === 'web') window.removeEventListener('storage', storage);
    };
  }, [id]);
  async function reveal() {
    if (!id || !authenticated || loading) return false;
    const controller = new AbortController(); request.current?.abort(); request.current = controller;
    setLoading(true); setError('');
    try {
      // Refresh the authenticated client and refuse missing credentials before requesting a solution.
      const token = await getAuthToken();
      if (controller.signal.aborted) return false;
      if (!token) { setAuthenticated(false); setAnswer(null); return false; }
      const response = await getPuzzleAnswer(id, controller.signal);
      if (controller.signal.aborted) return false;
      setAnswer(response.data.data); return true;
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (isAxiosError(failure) && failure.response?.status === 401) { setAuthenticated(false); setAnswer(null); }
        else setError('Unable to load the solution. Please try again.');
      }
      return false;
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }
  return { authenticated, answer, loading, error, reveal };
}
