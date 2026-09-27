import React from 'react';
import { View } from 'react-native';
import { PuzzleFrame } from '@/features/puzzles/PuzzleScreen';
import { PuzzleSection } from '@/features/puzzles/PuzzleSection';
import { usePuzzleAccess } from '@/features/puzzles/usePuzzleAccess';
export default function PuzzlesScreen() {
  const access = usePuzzleAccess();
  return <PuzzleFrame authenticated={access.authenticated === true}>
    <View style={{ width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24 }}><PuzzleSection categorized /></View>
  </PuzzleFrame>;
}
