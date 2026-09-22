import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PuzzleShare } from './PuzzleShare';
import { PuzzleDiagram } from './PuzzleDiagram';
import { usePuzzleAccess } from './usePuzzleAccess';
import { AppLayout } from '@/components/AppLayout';
import { GameBack, useGameTheme } from '@/features/games/GameUI';
import { getPuzzleById, Puzzle, puzzles } from './puzzles';

export default function PuzzleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = typeof id === 'string' ? getPuzzleById(id) : undefined;
  return <PuzzleDetail key={id} puzzle={puzzle} />;
}

function PuzzleDetail({ puzzle }: { puzzle?: Puzzle }) {
  const theme = useGameTheme(), router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const access = usePuzzleAccess(puzzle?.id);
  const { answer } = access;
  const login = () => router.push({ pathname: '/onboarding', params: { puzzleId: puzzle?.id } });
  const index = puzzles.findIndex(item => item.id === puzzle?.id);
  const textStyle = { color: theme.text, fontSize: 15, lineHeight: 23 };
  const heading = { color: theme.text, fontSize: 18, fontWeight: '700' as const };
  const next = puzzles[index + 1];
  return <PuzzleFrame authenticated={access.authenticated === true}>
    <View testID="puzzle-detail" style={{ width: '100%', maxWidth: 720, paddingHorizontal: 16, alignSelf: 'center', gap: 16, paddingBottom: 20 }}>
      <GameBack backLabel={access.authenticated ? 'Back to Games' : 'Back to Vault'} onPress={() => router.replace(access.authenticated ? '/games' : '/')} />
      {!puzzle ? <>
        <Text accessibilityRole="header" style={heading}>Puzzle not found</Text>
        <Text style={textStyle}>Return to Games to choose one of the available puzzles.</Text>
      </> : <>
        <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>{puzzle.category} · {puzzle.difficulty} · {index + 1} of {puzzles.length}</Text>
        <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '800' }}>{puzzle.title}</Text>
        <PuzzleShare puzzle={puzzle} />
        <Text selectable style={textStyle}>{puzzle.question}</Text>
        {!!puzzle.conditions?.length && <View style={{ padding: 16, gap: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement, borderRadius: 16 }}>
          <Text accessibilityRole="header" style={heading}>Conditions</Text>
          {puzzle.conditions.map(condition => <View key={condition} style={{ flexDirection: 'row', gap: 8 }}><Text style={textStyle}>•</Text><Text selectable style={[textStyle, { flex: 1 }]}>{condition}</Text></View>)}
        </View>}
        {access.authenticated === false && <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Sign in to see the answer and step-by-step solution.</Text>}
        <Pressable accessibilityRole="button" disabled={access.authenticated === null || access.loading} accessibilityState={{ expanded: !!(access.authenticated && revealed && answer), disabled: access.authenticated === null || access.loading }} onPress={() => {
          if (!access.authenticated) { login(); return; }
          if (revealed && answer) setRevealed(false);
          else void access.reveal().then(success => { if (success) setRevealed(true); });
        }} style={({ pressed }) => ({ minHeight: 48, padding: 12, borderRadius: 14, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', opacity: pressed || access.loading ? .75 : 1 })}><Text style={{ color: theme.background, fontSize: 15, fontWeight: '700' }}>{access.authenticated === null ? 'Checking sign-in…' : !access.authenticated ? 'Sign in to view answer' : access.loading ? 'Loading solution…' : revealed && answer ? 'Hide solution' : 'Reveal answer & solution'}</Text></Pressable>
        {!!access.error && <Text accessibilityLiveRegion="polite" style={{ color: theme.danger }}>{access.error}</Text>}
        {access.authenticated && revealed && answer && <View style={{ gap: 16 }}>
          <View style={{ backgroundColor: theme.accentMuted, padding: 16, borderRadius: 16, gap: 8 }}><Text accessibilityRole="header" style={heading}>Answer</Text><Text selectable style={textStyle}>{answer.answer}</Text></View>
          {!!answer.visual && <PuzzleDiagram visual={answer.visual} />}
          {!!answer.visualNotice && <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{answer.visualNotice}</Text>}
          <Text accessibilityRole="header" style={heading}>Step-by-step solution</Text>
          {answer.solution.map((step, stepIndex) => <View key={stepIndex} style={{ gap: 8 }}>
            <Text accessibilityRole="header" style={[heading, { fontSize: 16 }]}>{stepIndex + 1}. {step.title || 'Step'}</Text>
            <Text selectable style={textStyle}>{step.content}</Text>
            {!!step.code && <View style={{ padding: 12, borderRadius: 12, backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border }}><Text selectable style={{ color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, lineHeight: 20 }}>{step.code}</Text></View>}
          </View>)}
          {!!answer.keyIdea && <View style={{ borderLeftWidth: 3, borderColor: theme.accent, paddingLeft: 14, gap: 8 }}><Text accessibilityRole="header" style={heading}>Key idea</Text><Text selectable style={textStyle}>{answer.keyIdea}</Text></View>}
        </View>}
        {next && <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/games/puzzles/[id]', params: { id: next.id } })} style={{ minHeight: 48, paddingVertical: 12, justifyContent: 'center' }}><Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>Next: {next.title} →</Text></Pressable>}
      </>}
    </View>
  </PuzzleFrame>;
}

function PuzzleFrame({ authenticated, children }: { authenticated: boolean; children: React.ReactNode }) {
  const theme = useGameTheme();
  if (authenticated) return <AppLayout mobileTitle="Puzzles" themeOverride={theme}>{children}</AppLayout>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={{ padding: 16, borderBottomWidth: 1, borderColor: theme.border }}><Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>Vault · Puzzles</Text></View>
    <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>{children}</ScrollView>
  </SafeAreaView>;
}
