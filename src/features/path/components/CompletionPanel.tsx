import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { Game, formatTime } from '../state/game';
import { PathButton, label } from './PathUI';
export function CompletionPanel({ game, onNew, onReplay, onBack }: { game: Game; onNew: () => void; onReplay: () => void; onBack: () => void }) {
  const theme = useTheme(), opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== 'web' }).start(); }, [opacity]);
  return <Animated.View accessibilityLiveRegion="polite" style={{ opacity, padding: 12, gap: 8, borderRadius: 20, backgroundColor: theme.accentMuted, width: '100%' }}>
    <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Puzzle Complete</Text>
    <Text style={{ color: theme.accent, fontSize: 24, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] }}>{formatTime(game.elapsed)}</Text>
    <Text style={{ color: theme.text, textAlign: 'center' }}>{label(game.puzzle.difficulty)} · {label(game.puzzle.variation)}</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>{[[game.moves, 'Moves'], [game.mistakes, 'Mistakes'], [game.hints, 'Hints used']].map(([value, title]) => <View key={title} style={{ alignItems: 'center', gap: 4 }}><Text style={{ color: theme.text, fontWeight: '800', fontSize: 20 }}>{value}</Text><Text style={{ color: theme.textSecondary }}>{title}</Text></View>)}</View>
    <PathButton title="New Puzzle" primary onPress={onNew} /><PathButton title="Replay" onPress={onReplay} /><PathButton title="Back to Games" onPress={onBack} />
  </Animated.View>;
}
