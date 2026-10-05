import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PuzzleFrame } from '@/features/puzzles/PuzzleScreen';
import { PuzzleSection } from '@/features/puzzles/PuzzleSection';
import { usePuzzleAccess } from '@/features/puzzles/usePuzzleAccess';
import { getDailyPuzzle } from '@/features/puzzles/puzzles';
import { useRouter } from 'expo-router';
import { useGameTheme } from '@/features/games/GameUI';
export default function PuzzlesScreen() {
  const access = usePuzzleAccess();
  const router = useRouter(), theme = useGameTheme(), daily = getDailyPuzzle();
  return <PuzzleFrame authenticated={access.authenticated === true}>
    <View style={{ width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/puzzles/[id]', params: { id: daily.id } })} style={{ padding: 18, borderRadius: 18, backgroundColor: theme.accentMuted, gap: 6 }}>
        <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '800' }}>PUZZLE OF THE DAY</Text>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{daily.title}</Text>
        <Text style={{ color: theme.textSecondary }}>Open today’s challenge →</Text>
      </Pressable>
      <PuzzleSection categorized />
    </View>
  </PuzzleFrame>;
}
