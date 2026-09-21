import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { MatchResult } from '../types';
import { styles } from '../styles';
import { ClashButton, seconds } from './ClashUI';
export function ResultOverlay({ result, onRematch, onChange, onBack }: { result: MatchResult; onRematch: () => void; onChange: () => void; onBack: () => void }) {
  const theme = useTheme();
  const title = result.mode === 'local' ? `${result.winner?.toUpperCase()} WINS` : result.winner === 'blue' ? 'YOU WIN!' : 'COMPUTER WINS';
  return <View style={styles.overlay}>
    <View accessibilityViewIsModal style={[styles.overlayCard, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ gap: 18 }}>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.title, { fontSize: 27, letterSpacing: 1, color: theme.text }]}>{title}</Text>
        <Text style={{ fontSize: 36, color: theme.accent, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] }}>{seconds(result.elapsed)}</Text>
        <View style={styles.row}>{(['red', 'blue'] as const).map(player => <View key={player} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
          <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{result.mode === 'computer' ? player === 'red' ? 'CPU · RED' : 'YOU · BLUE' : player.toUpperCase()}</Text>
          <Text style={{ color: theme.text, fontSize: 28, fontWeight: '800' }}>{result[player].averageTPS.toFixed(1)}</Text>
          <Text style={{ color: theme.textSecondary }}>Average TPS</Text>
          <Text style={{ color: theme.text, fontWeight: '700' }}>{result[player].taps} taps</Text>
          <Text style={{ color: theme.textSecondary }}>Peak {result[player].peakTPS.toFixed(1)} TPS</Text>
        </View>)}</View>
        <ClashButton title="REMATCH" primary onPress={onRematch} />
        <ClashButton title={result.mode === 'computer' ? 'CHANGE LEVEL' : 'CHANGE MODE'} onPress={onChange} />
        <ClashButton title="BACK TO GAMES" onPress={onBack} />
      </ScrollView>
    </View>
  </View>;
}
