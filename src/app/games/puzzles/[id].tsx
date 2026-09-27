import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { puzzles } from '@/features/puzzles/puzzles';
export function generateStaticParams() { return puzzles.map(({ id }) => ({ id })); }
export default function LegacyPuzzle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/puzzles/[id]', params: { id } }} />;
}
