import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { AppLayout } from '@/components/AppLayout';
import { useGameTheme as useTheme, GameBack } from '@/features/games/GameUI';
import { usePathGame } from '../state/usePathGame';
import { formatTime } from '../state/game';
import { PathBoard } from './PathBoard';
import { PathButton, label } from './PathUI';
import { NewPuzzleModal } from './NewPuzzleModal';
import { PathSetup } from './PathSetup';
import { CompletionPanel } from './CompletionPanel';
export default function PathScreen() {
  const theme = useTheme(), router = useRouter(), game = usePathGame(), [selector, setSelector] = useState(false);
  const scrollGesture = useMemo(() => Gesture.Native(), []);
  const [drawing, setDrawing] = useState(false);
  const current = game.state.game;
  const [completedGameId, setCompletedGameId] = useState<string | null>(null);
  useEffect(() => {
    setCompletedGameId(null);
    if (!current?.completed) return;
    const timer = setTimeout(() => setCompletedGameId(current.attemptId), 450);
    return () => clearTimeout(timer);
  }, [current?.attemptId, current?.completed]);
  const showCompletion = current?.completed && completedGameId === current.attemptId;
  return <AppLayout themeOverride={theme} mobileTitle="Path" scrollable={false} mobileBackLabel="Back to Games" mobileBackAction={() => router.replace('/games')} showMobileSearch={false}>
    <GameBack onPress={() => router.replace('/games')} />
    <GestureHandlerRootView style={{ flex: 1 }}><GestureDetector gesture={scrollGesture}><ScrollView scrollEnabled={!drawing} bounces={false} overScrollMode="never" contentContainerStyle={{ alignItems: 'center' as const, paddingBottom: 28, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <View style={{ width: '100%', maxWidth: 520, alignItems: 'center' as const, gap: 14 }}>
        {current && <Text style={{ fontSize: 30, fontWeight: '800', letterSpacing: 5, color: theme.text }}>PATH</Text>}

        {game.error ? <Text accessibilityLiveRegion="polite" style={{ color: theme.danger, textAlign: 'center' }}>{game.error}</Text> : null}
        {!game.ready && !game.error && <ActivityIndicator color={theme.accent} accessibilityLabel="Loading saved game" />}
        {game.generating ? <View style={{ gap: 16, padding: 28, alignItems: 'center' }}><ActivityIndicator color={theme.accent} /><Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>Generating puzzle…</Text><PathButton title="Cancel" onPress={game.cancel} /></View> : null}
        {current && <>
          <Text style={{ color: theme.textSecondary }}>{label(current.puzzle.difficulty)} · {label(current.puzzle.variation)}{current.puzzle.seed.startsWith('path-daily-') ? ' · Daily' : ''}</Text>
          {!current.completed && <Text accessibilityLabel={`Elapsed time ${formatTime(current.elapsed)}`} style={{ color: theme.text, fontSize: 30, fontVariant: ['tabular-nums'], fontWeight: '600' }}>{formatTime(current.elapsed)}</Text>}
          {showCompletion ? <CompletionPanel game={current} onNew={() => setSelector(true)} onReplay={game.replay} onBack={() => router.replace('/games')} /> : <>
            <PathBoard scrollGesture={scrollGesture} onDrawingChange={setDrawing} puzzle={current.puzzle} path={current.path} disabled={game.generating || !game.ready || current.completed} hint={game.hint?.cell ?? null} invalid={game.invalidCell} onEnterCells={game.enterCells} />
            <View style={{ width: '100%', gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: theme.textSecondary }}>Progress</Text><Text style={{ color: theme.text, fontWeight: '700' }}>{current.path.length} / {current.puzzle.solution.length}</Text></View>
              <View style={{ height: 5, backgroundColor: theme.backgroundSelected, borderRadius: 3 }}><View style={{ height: 5, width: `${current.path.length / current.puzzle.solution.length * 100}%`, backgroundColor: theme.accent, borderRadius: 3 }} /></View>
            </View>
            <Text accessibilityLiveRegion="polite" style={{ minHeight: 38, color: game.invalidCell !== null ? theme.danger : theme.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>{current.completed ? 'Path complete!' : game.hint ? game.hint.backtrack ? 'Backtrack to the highlighted cell, then try a new direction.' : 'Continue to the highlighted cell.' : game.invalidCell !== null ? 'Move to a neighboring open cell. Follow the numbers in order.' : current.path.length ? 'Continue from the endpoint. Drag backward to undo.' : current.puzzle.finishAtLastCheckpoint ? `Slide from 1 to ${current.puzzle.checkpoints.length}, filling every open square.` : 'Start at 1. Slide through every open square in number order.'}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}><PathButton title="Undo" disabled={!current.path.length || game.generating || current.completed} onPress={game.undo} /><PathButton title="Hint" disabled={game.generating || current.completed} onPress={game.requestHint} /><PathButton title="Restart" disabled={game.generating} onPress={game.replay} /></View>
          </>}
        </>}
        {game.ready && current && !current.completed && <PathButton title='New Puzzle' primary disabled={game.generating} onPress={() => setSelector(true)} />}
        {game.ready && !current && <PathSetup difficulty={game.state.difficulty} variation={game.state.variation} disabled={game.generating} onStart={(d, v, daily) => { void game.start(d, v, daily); }} />}
      </View>
    </ScrollView></GestureDetector></GestureHandlerRootView>
    <NewPuzzleModal visible={selector} difficulty={game.state.difficulty} variation={game.state.variation} onClose={() => setSelector(false)} onDaily={d => { setSelector(false); void game.start(d, 'classic', true); }} onGenerate={(d, v) => { setSelector(false); void game.start(d, v); }} />
  </AppLayout>;
}
