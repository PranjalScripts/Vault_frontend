import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { GameArt, useGameTheme } from '@/features/games/GameUI';
import { useTapClash } from '../useTapClash';
import { levels, Mode } from '../types';

export function ClashSetup({ game, settings, onCloseSettings }: { game: ReturnType<typeof useTapClash>; settings: boolean; onCloseSettings: () => void }) {
  const theme = useGameTheme();
  const [mode, setMode] = useState<Mode>(game.mode);
  const heading = { color: theme.text, fontSize: 13, fontWeight: '700' as const };
  return <View style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <GameArt kind="clash" />
      <View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 24, fontWeight: '900' }}>TAP <Text style={{ color: '#FF416C' }}>CLASH</Text></Text><Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>Tap faster. Take the screen.</Text></View>
    </View>
    {settings ? <>
      <Text style={heading}>Game Settings</Text>
      {(['sound', 'haptics', 'momentum'] as const).map(key => <View key={key} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: theme.text }}>{key === 'sound' ? 'Sound' : key === 'haptics' ? 'Light haptics' : 'Momentum boost'}</Text><Switch accessibilityLabel={key} value={game.data.preferences[key]} onValueChange={value => game.preference(key, value)} trackColor={{ false: theme.border, true: '#FF416C' }} /></View>)}
      <Pressable accessibilityRole="button" onPress={onCloseSettings} style={{ minHeight: 44, borderRadius: 12, backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}><Text style={heading}>Done</Text></Pressable>
    </> : <>
      <Text style={heading}>Select Mode</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>{(['computer', 'local'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={value === 'computer' ? 'Vs Computer' : '2 Players'} accessibilityState={{ checked: mode === value }} onPress={() => setMode(value)} style={{ flex: 1, minHeight: 60, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: mode === value ? 2 : 1, borderColor: mode === value ? '#FF416C' : theme.border, backgroundColor: mode === value ? '#FF416C19' : theme.backgroundElement }}><FontAwesome5 name={value === 'computer' ? 'robot' : 'user-friends'} size={20} color={mode === value ? '#FF416C' : theme.text} /><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{value === 'computer' ? 'Vs Computer' : '2 Players'}</Text></Pressable>)}</View>
      {mode === 'computer' && <>
        <Text style={heading}>Select Difficulty</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{levels.map((level, index) => {
          const color = ['#00E6B0', '#009FFF', '#F5A623'][index];
          const selected = game.data.preferences.difficulty === level;
          return <Pressable key={level} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => game.preference('difficulty', level)} style={{ flex: 1, minHeight: 44, borderWidth: selected ? 2 : 1, borderColor: selected ? color : `${color}60`, borderRadius: 12, backgroundColor: `${color}16`, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{level === 'basic' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}</Text></Pressable>;
        })}</View>
      </>}
      <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 16 }}>{mode === 'computer' ? 'You control Blue. Tap your territory to take the screen.' : 'Sit opposite each other. Red takes the top, Blue takes the bottom.'}</Text>
      {!game.ready && <ActivityIndicator color="#FF416C" />}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !game.ready }} disabled={!game.ready} onPress={() => game.start(mode)} style={{ minHeight: 44, borderRadius: 22, backgroundColor: '#FF416C', opacity: game.ready ? 1 : .45, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Start Game</Text></Pressable>
    </>}
  </View>;
}
