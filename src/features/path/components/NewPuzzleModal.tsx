import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { Difficulty, Variation, difficulties, variations } from '../engine/types';
import { PathButton, label } from './PathUI';
export function NewPuzzleModal({ visible, difficulty, variation, onClose, onGenerate, onDaily }: { visible: boolean; difficulty: Difficulty; variation: Variation | 'random'; onClose: () => void; onGenerate: (d: Difficulty, v: Variation | 'random') => void; onDaily: (d: Difficulty) => void }) {
  const theme = useTheme(), [d, setD] = useState(difficulty), [v, setV] = useState(variation);
  useEffect(() => { if (visible) { setD(difficulty); setV(variation); } }, [visible, difficulty, variation]);
  const choice = (text: string, selected: boolean, onPress: () => void) => <Pressable key={text} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={{ minHeight: 44, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.text, fontWeight: selected ? '700' : '400' }}>{label(text)}</Text></Pressable>;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 440, maxHeight: '90%', padding: 24, gap: 18, backgroundColor: theme.background, borderRadius: 24 }}>
        <ScrollView contentContainerStyle={{ gap: 18 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>A new path</Text>
          <Text style={{ color: theme.textSecondary }}>Difficulty</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{difficulties.map(value => choice(value, d === value, () => setD(value)))}</View>
          <Text style={{ color: theme.textSecondary }}>Variation</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['random', ...variations] as const).map(value => choice(value, v === value, () => setV(value)))}</View>
          <Text style={{ color: theme.textSecondary, lineHeight: 20 }}>Every board is generated and checked for one unique solution. Your current puzzle is replaced only when the next is ready.</Text>
          <PathButton title="Generate Puzzle" primary onPress={() => onGenerate(d, v)} />
          <PathButton title="Play Today’s Daily · Classic" onPress={() => onDaily(d)} />
          <PathButton title="Cancel" onPress={onClose} />
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
