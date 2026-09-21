import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { AI_DIFFICULTIES } from '../config';
import { Difficulty, levels } from '../types';
import { styles } from '../styles';
import { ClashButton } from './ClashUI';
export function DifficultySelector({ value, onChange, onPlay, onBack }: { value: Difficulty; onChange: (v: Difficulty) => void; onPlay: () => void; onBack: () => void }) {
  const theme = useTheme();
  return <View style={styles.content}>
    <Text style={[styles.title, { color: theme.text, fontSize: 26 }]}>VS COMPUTER</Text>
    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choose your pace. You control Blue.</Text>
    {levels.map(level => <Pressable key={level} accessibilityRole="radio" accessibilityState={{ checked: level === value }} onPress={() => onChange(level)} style={[styles.card, { backgroundColor: value === level ? theme.accentMuted : theme.backgroundElement, borderColor: value === level ? theme.accent : theme.border }]}>
      <View style={styles.row}><Text style={{ color: theme.text, fontWeight: '800', fontSize: 18 }}>{level.toUpperCase()}</Text><Text style={{ color: theme.textSecondary }}>~{AI_DIFFICULTIES[level].minTPS}–{AI_DIFFICULTIES[level].maxTPS} TPS</Text></View>
      <Text style={{ color: theme.textSecondary }}>{level === 'basic' ? 'A relaxed rhythm with room to recover.' : level === 'medium' ? 'A steady rival. Keep your fingers moving.' : 'Fast and focused. Bring your best pace.'}</Text>
    </Pressable>)}
    <ClashButton title="PLAY" primary onPress={onPlay} /><ClashButton title="BACK" onPress={onBack} />
  </View>;
}
