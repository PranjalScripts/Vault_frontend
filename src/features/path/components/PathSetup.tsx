import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GameHero, StartButton, useGameTheme, useGameUI } from '@/features/games/GameUI';
import { Difficulty, Variation, difficulties, variations } from '../engine/types';
import { label } from './PathUI';
export function PathSetup({ difficulty, variation, onStart, disabled }: { difficulty: Difficulty; variation: Variation | 'random'; onStart: (d: Difficulty, v: Variation | 'random', daily?: boolean) => void; disabled: boolean }) {
  const theme = useGameTheme();
  const ui = useGameUI();
  const [d, setD] = useState(difficulty), [v, setV] = useState(variation);
  return <View style={{ width: '100%' }}>
    <GameHero kind="path" title="PATH" subtitle="One continuous line. Every open cell." />
    <Text style={[ui.info, { textAlign: 'center' }]}>Start at 1. Connect the numbers in order and fill every open square.</Text>
    <Text style={ui.heading}>Select Difficulty</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>{difficulties.map((value, i) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: d === value }} onPress={() => setD(value)} style={{ flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderWidth: d === value ? 2 : 1, borderColor: ['#00E6B0', '#009FFF', '#F5A623', '#C566F1'][i], borderRadius: 14, backgroundColor: d === value ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>{label(value)}</Text></Pressable>)}</View>
    <Text style={ui.heading}>Select Variation</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['random', ...variations] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: v === value }} onPress={() => setV(value)} style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 24, borderWidth: 1, borderColor: v === value ? theme.accent : theme.border, backgroundColor: v === value ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.text, fontSize: 13 }}>{label(value)}</Text></Pressable>)}</View>
    <StartButton title="Start Puzzle" color={theme.accent} disabled={disabled} onPress={() => onStart(d, v)} />
    <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onStart(d, 'classic', true)} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}><Text style={{ color: theme.accent, fontWeight: '600' }}>Play Today’s Daily Path →</Text></Pressable>
  </View>;
}
