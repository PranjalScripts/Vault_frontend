import React from 'react';
import { Text, View } from 'react-native';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { ClashStats, winRate } from '../stats';
import { styles } from '../styles';
import { ClashButton, seconds } from './ClashUI';
export function StatsPanel({ stats, onBack }: { stats: ClashStats; onBack: () => void }) {
  const theme = useTheme(), c = stats.computer, l = stats.local;
  const rows = (values: [string, string | number][]) => values.map(([title, value]) => <View key={title} style={styles.row}><Text style={{ color: theme.textSecondary, flex: 1 }}>{title}</Text><Text style={{ color: theme.text, fontWeight: '700' }}>{value}</Text></View>);
  return <View style={styles.content}>
    <Text style={[styles.title, { color: theme.text, fontSize: 28 }]}>YOUR STATS</Text>
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>VS Computer</Text>
      {rows([['Games played', c.played], ['Wins', c.wins], ['Losses', c.losses], ['Win rate', `${winRate(stats).toFixed(0)}%`], ['Basic wins', c.winsByLevel.basic], ['Medium wins', c.winsByLevel.medium], ['Hard wins', c.winsByLevel.hard], ['Fastest victory', c.fastestVictory === null ? '—' : seconds(c.fastestVictory)], ['Highest average TPS', c.highestAverageTPS.toFixed(1)], ['Peak TPS', c.peakTPS.toFixed(1)], ['Most taps', c.mostTaps]])}
    </View>
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Two Players</Text>
      {rows([['Local matches', l.played], ['Red wins', l.redWins], ['Blue wins', l.blueWins], ['Fastest match', l.fastestMatch === null ? '—' : seconds(l.fastestMatch)], ['Longest match', l.played ? seconds(l.longestMatch) : '—'], ['Highest TPS', l.highestTPS.toFixed(1)]])}
    </View>
    <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>Stats count completed matches on this device.</Text>
    <ClashButton title="BACK" onPress={onBack} />
  </View>;
}
