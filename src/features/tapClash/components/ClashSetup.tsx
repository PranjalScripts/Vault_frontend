import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { GameHero, ModeCards, StartButton, useGameTheme, useGameUI } from '@/features/games/GameUI';
import { useTapClash } from '../useTapClash';
import { levels, Mode } from '../types';

export function ClashSetup({ game, settings }: { game: ReturnType<typeof useTapClash>; settings: boolean }) {
  const theme = useGameTheme();
  const ui = useGameUI();
  const [mode, setMode] = useState<Mode>(game.mode);
  return <View style={ui.screen}>
    <GameHero kind="clash" title="TAP CLASH" subtitle="Tap faster. Take the screen." />
    <View style={{ flexDirection: 'row', borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement, paddingVertical: 16 }}>
      {([{ icon: 'flag', text: 'Two territories', color: '#FF416C' }, { icon: 'user-friends', text: 'Two modes', color: '#30C5F4' }, { icon: 'trophy', text: 'One winner', color: '#FFD23C' }] as const).map((item, i) => <View key={item.text} style={{ flex: 1, alignItems: 'center', gap: 8, borderLeftWidth: i ? 1 : 0, borderColor: theme.border }}><FontAwesome5 name={item.icon} color={item.color} size={22} /><Text style={{ color: theme.text, fontSize: 11 }}>{item.text}</Text></View>)}
    </View>
    <Text style={ui.heading}>Select Mode</Text>
    <ModeCards value={mode} onChange={setMode} color="#FF416C" />
    {mode === 'computer' ? <>
      <Text style={ui.heading}>Select Difficulty</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>{levels.map((level, index) => {
        const color = ['#00E6B0', '#009FFF', '#F5A623'][index];
        const selected = game.data.preferences.difficulty === level;
        return <Pressable key={level} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => game.preference('difficulty', level)} style={{ flex: 1, minHeight: 80, borderWidth: selected ? 2 : 1, borderColor: selected ? color : `${color}60`, borderRadius: 15, backgroundColor: `${color}16`, alignItems: 'center', justifyContent: 'center', gap: 8 }}><Feather name="smile" color={color} size={26} /><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{level === 'basic' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}</Text></Pressable>;
      })}</View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 10 }}><Feather name="info" color={theme.textSecondary} size={18} /><Text style={[ui.info, { flex: 1 }]}>Higher difficulty means a smarter and faster opponent.</Text></View>
    </> : <Text style={[ui.info, { marginVertical: 20 }]}>Sit opposite each other. Red takes the top, Blue takes the bottom. Tap your territory to take the screen.</Text>}
    {settings && <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16, gap: 12, marginTop: 16 }}>{(['sound', 'haptics', 'momentum'] as const).map(key => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: theme.text }}>{key === 'sound' ? 'Sound' : key === 'haptics' ? 'Light haptics' : 'Momentum boost'}</Text><Switch accessibilityLabel={key} value={game.data.preferences[key]} onValueChange={value => game.preference(key, value)} trackColor={{ false: theme.border, true: '#FF416C' }} /></View>)}</View>}
    {!game.ready && <ActivityIndicator color="#FF416C" style={{ marginTop: 12 }} />}
    <StartButton color="#FF416C" disabled={!game.ready} onPress={() => game.start(mode)} />
  </View>;
}
