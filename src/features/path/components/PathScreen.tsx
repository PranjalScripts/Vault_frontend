import { useGameCompletion, useGameReminderActivity } from "@/notifications/activity";
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { AppLayout } from '@/components/AppLayout';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { usePathGame } from '../state/usePathGame';
import { formatTime } from '../state/game';
import { PathBoard } from './PathBoard';
import { PathButton, label } from './PathUI';
import { PathSetup } from './PathSetup';
import { CompletionPanel } from './CompletionPanel';
export default function PathScreen({ newPuzzle = false }: { newPuzzle?: boolean }) {
  const theme = useTheme(), router = useRouter(), game = usePathGame();
  const [contentWidth, setContentWidth] = useState(0);
  const wide = contentWidth >= 680;
  const current = newPuzzle ? null : game.state.game;
  useGameReminderActivity("path", !newPuzzle && game.ready && !!current, !!current && !current.completed && current.path.length > 0);
  const pendingAttempt = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (newPuzzle && pendingAttempt.current !== undefined && game.state.game && game.state.game.attemptId !== pendingAttempt.current) {
      pendingAttempt.current = undefined;
      if (router.canGoBack()) router.back();
      else router.replace('/games/path');
    }
  }, [newPuzzle, game.state.game, router]);
  const openNewPuzzle = () => router.push('/games/path/new');
  useGameCompletion("path", !!current?.completed, game.ready && !!current);
  const [completedGameId, setCompletedGameId] = useState<string | null>(null);
  useEffect(() => {
    setCompletedGameId(null);
    if (!current?.completed) return;
    const timer = setTimeout(() => setCompletedGameId(current.attemptId), 450);
    return () => clearTimeout(timer);
  }, [current?.attemptId, current?.completed]);
  const showCompletion = current?.completed && completedGameId === current.attemptId;
  return <AppLayout themeOverride={theme} mobileTitle={newPuzzle ? 'New Puzzle' : 'Path'} scrollable={false}>
    <GestureHandlerRootView style={styles.content} onLayout={event => setContentWidth(event.nativeEvent.layout.width)}>
      {game.error ? <Text accessibilityLiveRegion="polite" style={{ color: theme.danger, fontSize: 12 }}>{game.error}</Text> : null}
      {!game.ready && !game.error && <ActivityIndicator color={theme.accent} accessibilityLabel="Loading saved game" />}
      {game.generating && <View style={styles.generation}><ActivityIndicator color={theme.accent} /><Text accessibilityLiveRegion="polite" style={{ color: theme.text, flex: 1 }}>Generating puzzle…</Text><PathButton title="Cancel" onPress={game.cancel} /></View>}
      <View style={[styles.layout, wide && styles.columns]}>
        {(current || wide) && <BoardSpace>{size =>
          current ? <PathBoard size={size} puzzle={current.puzzle} path={current.path} disabled={game.generating || !game.ready || current.completed} hint={game.hint?.cell ?? null} invalid={game.invalidCell} onEnterCells={game.enterCells} /> : <BoardPreview />
        }</BoardSpace>}
        <View style={[styles.info, wide ? styles.desktopInfo : styles.mobileInfo]}>
          {current ? <>
            {showCompletion ? <CompletionPanel game={current} onNew={openNewPuzzle} onReplay={game.replay} onBack={() => router.replace('/games')} /> : <>
              <View style={styles.summary}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, flex: 1 }}>{label(current.puzzle.difficulty)} · {label(current.puzzle.variation)}{current.puzzle.seed.startsWith('path-daily-') ? ' · Daily' : ''}</Text>
                {!current.completed && <Text accessibilityLabel={`Elapsed time ${formatTime(current.elapsed)}`} style={{ color: theme.text, fontSize: 22, fontVariant: ['tabular-nums'], fontWeight: '600' }}>{formatTime(current.elapsed)}</Text>}
              </View>
              <View style={{ gap: 4 }}>
                <View style={styles.summary}><Text style={{ color: theme.textSecondary, fontSize: 12 }}>Progress</Text><Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{current.path.length} / {current.puzzle.solution.length}</Text></View>
                <View style={{ height: 4, backgroundColor: theme.backgroundSelected, borderRadius: 3 }}><View style={{ height: 4, width: `${current.path.length / current.puzzle.solution.length * 100}%`, backgroundColor: theme.accent, borderRadius: 3 }} /></View>
              </View>
              <Text accessibilityLiveRegion="polite" style={{ color: game.invalidCell !== null ? theme.danger : theme.textSecondary, fontSize: 12, lineHeight: 16 }}>{current.completed ? 'Path complete!' : game.hint ? game.hint.backtrack ? 'Backtrack to the highlighted cell, then try a new direction.' : 'Continue to the highlighted cell.' : game.invalidCell !== null ? 'Move to a neighboring open cell. Follow the numbers in order.' : current.path.length ? 'Continue from the endpoint. Drag backward to undo.' : current.puzzle.finishAtLastCheckpoint ? `Slide from 1 to ${current.puzzle.checkpoints.length}, filling every open square.` : 'Start at 1. Slide through every open square in number order.'}</Text>
              <View style={styles.controls}><PathButton title="Undo" disabled={!current.path.length || game.generating || current.completed} onPress={game.undo} /><PathButton title="Hint" disabled={game.generating || current.completed} onPress={game.requestHint} /><PathButton title="Restart" disabled={game.generating} onPress={game.replay} /></View>
              {game.ready && !current.completed && <PathButton title="New Puzzle" primary disabled={game.generating} onPress={openNewPuzzle} />}
            </>}
          </> : game.ready && <PathSetup title={newPuzzle ? 'New Puzzle' : 'Path'} difficulty={game.state.difficulty} variation={game.state.variation} disabled={game.generating} onStart={(d, v, daily) => { pendingAttempt.current = game.state.game?.attemptId ?? null; void game.start(d, v, daily); }} />}
        </View>
      </View>
    </GestureHandlerRootView>
  </AppLayout>;
}

// Measure the flex space AppLayout actually gives us, including room reserved for controls.
function BoardSpace({ children }: { children: (size: number) => React.ReactNode }) {
  const [size, setSize] = useState(0);
  return <View testID="path-board-space" style={styles.boardSpace} onLayout={({ nativeEvent: { layout } }) => setSize(Math.floor(Math.min(layout.width, layout.height)))}>
    {size > 0 && <View style={{ width: size, height: size }}>{children(size)}</View>}
  </View>;
}

// A presentation-only preview: selecting settings never starts or generates a puzzle.
function BoardPreview() {
  const theme = useTheme();
  return <View accessible accessibilityLabel="Path board preview. Choose your settings to start a puzzle." style={[styles.preview, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
    {Array.from({ length: 25 }, (_, i) => <View key={i} style={{ width: '20%', height: '20%', borderWidth: .5, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 9, 10, 19, 24].includes(i) && <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '800' }}>{[0, 9, 10, 19, 24].indexOf(i) + 1}</Text>}
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  content: { flex: 1, minHeight: 0, gap: 6, paddingBottom: 8 },
  layout: { flex: 1, minHeight: 0, gap: 8 },
  columns: { flexDirection: 'row', gap: 24, alignItems: 'stretch' },
  boardSpace: { flex: 1, minHeight: 0, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  info: { gap: 8, minWidth: 0 },
  desktopInfo: { width: 320, justifyContent: 'center' },
  mobileInfo: { width: '100%', maxWidth: 520, alignSelf: 'center', flexShrink: 0 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  generation: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { width: '100%', height: '100%', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
});
