import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const gameThemeDark = {
  text: '#F6F7FC', background: '#050C12', backgroundElement: '#0D1722',
  backgroundSelected: '#172333', textSecondary: '#A7BADA', accent: '#00E6B0',
  accentMuted: '#003D32', border: '#233044', danger: '#FF496C', link: '#00E6B0',
};

export const gameThemeLight = {
  text: '#1A1916', background: '#F4F1EA', backgroundElement: '#FFFFFF',
  backgroundSelected: '#E8E3D8', textSecondary: '#6F6A62', accent: '#1F4E3D',
  accentMuted: '#DCE8E2', border: '#E4DFD4', danger: '#C23B22', link: '#1A6B4A',
};

export const gameTheme = gameThemeDark;

export function useGameTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? gameThemeDark : gameThemeLight;
}
export type GameKind = 'path' | 'clash' | 'tic';
export const gameColors = { path: '#00E6B0', clash: '#FF416C', tic: '#F6C434' };

/** Native shapes stay crisp on every phone, including the small catalog artwork. */
export function GameArt({ kind, large = false }: { kind: GameKind; large?: boolean }) {
  const size = large ? 230 : 84;
  const color = gameColors[kind];
  return <View accessible={false} style={{ width: size, height: large ? 200 : size, alignItems: 'center', justifyContent: 'center' }}>
    {kind === 'clash' ? <>
      <View style={{ position: 'absolute', width: size * .62, height: size * .62, right: 0, top: large ? 24 : 2, borderRadius: size, backgroundColor: '#005FFF', borderWidth: large ? 12 : 6, borderColor: '#009CFF', shadowColor: '#008CFF', shadowOpacity: .9, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } }}><View style={{ position: 'absolute', inset: '25%', backgroundColor: '#00B6FF', borderRadius: size }} /></View>
      <View style={{ position: 'absolute', width: size * .64, height: size * .64, left: 0, bottom: large ? 12 : 0, borderRadius: size, backgroundColor: '#FF2358', borderWidth: large ? 12 : 6, borderColor: '#FF5879', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF2358', shadowOpacity: .85, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } }}><FontAwesome5 name="bolt" size={large ? 66 : 29} color="white" /></View>
    </> : kind === 'path' ? <>
      <View style={{ position: 'absolute', width: size * .59, height: 4, backgroundColor: color, transform: [{ rotate: '60deg' }], left: size * .33, top: size * .50 }} />
      <View style={{ position: 'absolute', width: size * .59, height: 4, backgroundColor: color, transform: [{ rotate: '-60deg' }], left: size * .04, top: size * .50 }} />
      {[{ left: .37, top: .14 }, { left: .08, top: .65 }, { left: .67, top: .65 }].map((point, i) => <View key={i} style={{ position: 'absolute', left: size * point.left, top: size * point.top, width: size * .25, height: size * .25, borderWidth: 3, borderColor: color, borderRadius: size, backgroundColor: '#032720', alignItems: 'center', justifyContent: 'center' }}><View style={{ width: '55%', height: '55%', borderRadius: size, backgroundColor: color }} /></View>)}
    </> : <View style={{ width: size * .88, height: size * .88, flexDirection: 'row', flexWrap: 'wrap' }}>{['×', '○', '×', '○'].map((mark, i) => <View key={i} style={{ width: '50%', height: '50%', borderRightWidth: i % 2 === 0 ? 2 : 0, borderBottomWidth: i < 2 ? 2 : 0, borderColor: '#746342', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: i % 2 ? '#FFE04C' : '#FF9C28', fontSize: large ? 72 : 40, lineHeight: large ? 82 : 43, fontWeight: '500' }}>{mark}</Text></View>)}</View>}
  </View>;
}
export function GameHero({ kind, title, subtitle }: { kind: GameKind; title: string; subtitle: string }) {
  const theme = useGameTheme();
  return <View style={{ alignItems: 'center' as const, paddingTop: 4, paddingBottom: 20 }}>
    <GameArt kind={kind} large />
    <Text style={{ color: theme.text, fontSize: 34, fontWeight: '900' as const, fontStyle: 'italic' as const, letterSpacing: .5, marginTop: 12 }}>{title.split(' ').slice(0, -1).join(' ')}{title.includes(' ') ? ' ' : ''}<Text style={{ color: gameColors[kind] }}>{title.split(' ').at(-1)}</Text></Text>
    <Text style={{ color: theme.textSecondary, fontSize: 16, marginTop: 7, textAlign: 'center' as const }}>{subtitle}</Text>
  </View>;
}
export function GameBack({ onPress, onSettings }: { onPress: () => void; onSettings?: () => void }) {
  const theme = useGameTheme();
  const iconButton = { width: 44, height: 44, justifyContent: 'center' as const, alignItems: 'center' as const };
  return <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: 14 }}><Pressable accessibilityRole="button" accessibilityLabel="Back to Games" onPress={onPress} style={iconButton}><Feather name="chevron-left" color={theme.text} size={30} /></Pressable>{onSettings && <Pressable accessibilityRole="button" accessibilityLabel="Game settings" onPress={onSettings} style={iconButton}><Feather name="more-horizontal" color={theme.text} size={26} /></Pressable>}</View>;
}
export function StartButton({ title = 'Start Game', color, onPress, disabled }: { title?: string; color: string; onPress: () => void; disabled?: boolean }) {
  const theme = useGameTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ minHeight: 56, borderRadius: 32, backgroundColor: color, opacity: disabled ? .4 : pressed ? .8 : 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 20, marginTop: 12 })}><Text style={{ color: color === gameColors.clash ? '#FFFFFF' : theme.background, fontSize: 19, fontWeight: '800' as const }}>{title}</Text><Feather name="arrow-right" size={25} color={color === gameColors.clash ? '#FFFFFF' : theme.background} /></Pressable>;
}
export function ModeCards({ value, onChange, color }: { value: 'computer' | 'local'; onChange: (mode: 'computer' | 'local') => void; color: string }) {
  const theme = useGameTheme();
  return <View style={{ flexDirection: 'row' as const, gap: 16 }}>{(['computer', 'local'] as const).map(mode => <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: value === mode }} onPress={() => onChange(mode)} style={{ flex: 1, minHeight: 124, borderWidth: value === mode ? 2 : 1, borderColor: value === mode ? color : theme.border, borderRadius: 18, backgroundColor: value === mode ? `${color}19` : theme.backgroundElement, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 8 }}>
    {value === mode && <View style={{ position: 'absolute', top: 8, right: 8, borderRadius: 14, padding: 4, backgroundColor: color }}><Feather name="check" color="#FFFFFF" size={13} /></View>}
    <FontAwesome5 name={mode === 'computer' ? 'robot' : 'user-friends'} color={value === mode ? color : theme.text} size={28} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' as const }}>{mode === 'computer' ? 'Vs Computer' : '2 Players'}</Text><Text style={{ color: theme.textSecondary, fontSize: 13 }}>{mode === 'computer' ? 'Play against AI' : 'Same device'}</Text>
  </Pressable>)}</View>;
}
export function useGameUI() {
  const theme = useGameTheme();
  return {
    screen: { width: '100%', maxWidth: 520, alignSelf: 'center' as const, paddingHorizontal: 20, paddingBottom: 28 },
    heading: { color: theme.text, fontSize: 17, fontWeight: '700' as const, marginTop: 20, marginBottom: 12 },
    iconButton: { width: 44, height: 44, justifyContent: 'center' as const, alignItems: 'center' as const },
    info: { color: theme.textSecondary, fontSize: 13, lineHeight: 20 },
  };
}
