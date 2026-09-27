import React, { useState } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Feather from '@expo/vector-icons/Feather';
import { useGameTheme } from '@/features/games/GameUI';
import { Puzzle } from './puzzles';

export function PuzzleShare({ puzzle }: { puzzle: Puzzle }) {
  const theme = useGameTheme();
  const [busy, setBusy] = useState(false), [feedback, setFeedback] = useState('');
  async function share() {
    if (busy) return;
    setBusy(true); setFeedback('');
    try {
      const origin = process.env.EXPO_PUBLIC_WEB_URL || (Platform.OS === 'web' ? window.location.origin : '');
      if (!/^https?:\/\//i.test(origin)) throw Error('The public website address is not configured for sharing.');
      const url = new URL(`/puzzles/${encodeURIComponent(puzzle.id)}`, origin).toString();
      // Send only the URL: some share targets concatenate text into the link.
      if (Platform.OS === 'web' && typeof navigator.share === 'function') {
        await navigator.share({ url });
      } else if (Platform.OS === 'web') {
        if (!await Clipboard.setStringAsync(url)) throw Error('Unable to copy the share link. Please try again.');
        setFeedback('Puzzle and solution link copied.');
      } else {
        await Share.share(Platform.OS === 'ios' ? { url } : { message: url });
      }
    } catch (failure) {
      if (!(failure instanceof Error && failure.name === 'AbortError')) setFeedback(failure instanceof Error ? failure.message : 'Unable to share. Please try again.');
    } finally { setBusy(false); }
  }
  return <View style={{ gap: 6 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Share puzzle" disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => void share()} style={{ minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement }}><Feather name="share-2" color={theme.accent} size={18} /><Text style={{ color: theme.accent, fontWeight: '700' }}>{busy ? 'Sharing…' : 'Share puzzle'}</Text></Pressable>
    {!!feedback && <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary, fontSize: 12 }}>{feedback}</Text>}
  </View>;
}
