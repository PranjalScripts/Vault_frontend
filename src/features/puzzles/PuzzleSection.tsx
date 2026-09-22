import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useGameTheme } from '@/features/games/GameUI';
import { puzzles } from './puzzles';

const categories = [...new Set(puzzles.map(puzzle => puzzle.category))];

export function PuzzleSection({ categorized = false }: { categorized?: boolean }) {
  const theme = useGameTheme(), router = useRouter();
  const [category, setCategory] = useState('All');
  const groups = categorized ? categories.filter(value => category === 'All' || value === category) : [null];
  return <View style={{ gap: 10, marginTop: 8 }}>
    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>Puzzles</Text>
    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>Think it through, then explore the answer step by step.</Text>
    {categorized && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {['All', ...categories].map(value => <Pressable key={value} accessibilityRole="tab" accessibilityLabel={value === 'All' ? 'All puzzle categories' : `${value} puzzles`} accessibilityState={{ selected: category === value }} onPress={() => setCategory(value)} style={{ minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: category === value ? theme.accent : theme.border, backgroundColor: category === value ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.text, fontSize: 13, fontWeight: category === value ? '700' : '500' }}>{value}</Text></Pressable>)}
    </View>}
    {groups.map(group => <View key={group ?? 'all'} style={{ gap: 10 }}>
      {group && <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 17, fontWeight: '700', marginTop: 6 }}>{group} · {puzzles.filter(puzzle => puzzle.category === group).length}</Text>}
      {puzzles.filter(puzzle => !group || puzzle.category === group).map(puzzle => <Pressable key={puzzle.id} accessibilityRole="button" accessibilityLabel={`Open ${puzzle.title}, ${puzzle.category}, ${puzzle.difficulty}`} onPress={() => router.push({ pathname: '/games/puzzles/[id]', params: { id: puzzle.id } })} style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? .75 : 1 })}>
      <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentMuted }}><Text style={{ color: theme.accent, fontSize: 15, fontWeight: '800' }}>{puzzles.indexOf(puzzle) + 1}</Text></View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{puzzle.title}</Text>
        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>{puzzle.category} · {puzzle.difficulty}</Text>
        <Text numberOfLines={2} style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>{puzzle.question}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>)}
    </View>)}
  </View>;
}
