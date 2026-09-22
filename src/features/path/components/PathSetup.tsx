import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useGameTheme } from '@/features/games/GameUI';
import { Difficulty, Variation, difficulties, variations } from '../engine/types';
import { PathButton, label } from './PathUI';
export function PathSetup({ title = 'Path', difficulty, variation, onStart, disabled }: { title?: string; difficulty: Difficulty; variation: Variation | 'random'; onStart: (d: Difficulty, v: Variation | 'random', daily?: boolean) => void; disabled: boolean }) {
  const theme = useGameTheme();
  const [d, setD] = useState(difficulty), [v, setV] = useState(variation);
  const heading = { color: theme.text, fontSize: 13, fontWeight: '700' as const };
  return <View style={{ width: '100%', gap: 8 }}>
    <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{title}</Text>
    <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 16 }}>Start at 1. Connect the numbers in order and fill every open square.</Text>
    <Text style={heading}>Difficulty</Text>
    <View style={{ flexDirection: 'row', gap: 4 }}>{difficulties.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: d === value }} onPress={() => setD(value)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: d === value ? 2 : 1, borderColor: d === value ? theme.accent : theme.border, borderRadius: 10, backgroundColor: d === value ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>{label(value)}</Text></Pressable>)}</View>
    <Text style={heading}>Variation</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>{(['random', ...variations] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: v === value }} onPress={() => setV(value)} style={{ width: '32%', flexGrow: 1, minHeight: 44, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: v === value ? theme.accent : theme.border, backgroundColor: v === value ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.text, fontSize: 12 }}>{label(value)}</Text></Pressable>)}</View>
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <View style={{ flex: 1 }}><PathButton title="Start Puzzle" primary disabled={disabled} onPress={() => onStart(d, v)} /></View>
      <View style={{ flex: 1 }}><PathButton title="Daily Path" disabled={disabled} onPress={() => onStart(d, 'classic', true)} /></View>
    </View>
  </View>;
}
