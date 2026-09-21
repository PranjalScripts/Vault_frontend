import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppLayout } from '@/components/AppLayout';
import { useGameTheme as useTheme, GameBack } from '@/features/games/GameUI';
import { ClashSetup } from './ClashSetup';
import { useTapClash } from '../useTapClash';
import { styles } from '../styles';
import { ClashButton } from './ClashUI';
import { BattleArena } from './BattleArena';
import { Countdown } from './Countdown';
import { ResultOverlay } from './ResultOverlay';
export default function TapClashScreen() {
  const theme = useTheme(), router = useRouter(), game = useTapClash();
  const [settings, setSettings] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pause = game.pause;
  const battle = ['countdown', 'running', 'paused', 'takeover', 'result'].includes(game.phase);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion); return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!battle || game.phase === 'result') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => { pause(); return true; });
    return () => handler.remove();
  }, [battle, pause, game.phase]);
  return <AppLayout themeOverride={theme} mobileTitle="Tap Clash" mobileBackLabel="Back to Games" mobileBackAction={() => router.replace('/games')} showMobileSearch={false} scrollable={false}>
    {!battle && <GameBack onPress={() => router.replace('/games')} onSettings={() => setSettings(value => !value)} />}
    {battle ? <View style={{ flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
      <BattleArena snapshot={game.snapshot} mode={game.mode} boundary={game.boundary} redPulse={game.redPulse} bluePulse={game.bluePulse} enabled={game.phase === 'running'} reducedMotion={reducedMotion} onTaps={game.tap} />
      {(game.phase === 'countdown' || (game.phase === 'running' && game.countdown === 0)) && <Countdown value={game.countdown} local={game.mode === 'local'} />}
      {(game.phase === 'running' || game.phase === 'countdown') && <Pressable accessibilityRole="button" accessibilityLabel="Pause match" onPress={game.pause} style={{ position: 'absolute', right: 10, top: 10, minWidth: 48, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000044' }}><Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 18 }}>Ⅱ</Text></Pressable>}
      {game.phase === 'paused' && <View style={styles.overlay}><View accessibilityViewIsModal style={[styles.overlayCard, { backgroundColor: theme.background }]}><Text style={[styles.title, { color: theme.text, fontSize: 28 }]}>PAUSED</Text><Text style={[styles.subtitle, { color: theme.textSecondary }]}>Take a breath. Both sides are paused.</Text><ClashButton title="RESUME" primary onPress={game.resume} /><ClashButton title="RETURN TO MENU" onPress={() => game.menu('menu')} /></View></View>}
      {game.phase === 'result' && game.result && <ResultOverlay result={game.result} onRematch={() => game.start(game.mode)} onChange={() => game.menu(game.mode === 'computer' ? 'level' : 'menu')} onBack={() => router.replace('/games')} />}
    </View> : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <ClashSetup game={game} settings={settings} />
      {game.error ? <Text accessibilityLiveRegion="polite" style={{ color: theme.danger, textAlign: 'center', margin: 12 }}>{game.error}</Text> : null}
    </ScrollView>}
  </AppLayout>;
}
