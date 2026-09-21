import React from 'react';
import { Pressable, Text } from 'react-native';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { styles } from '../styles';
export function ClashButton({ title, onPress, primary = false, disabled = false }: { title: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: primary ? theme.accent : theme.backgroundElement, borderColor: theme.border, opacity: disabled ? .45 : pressed ? .7 : 1 }]}>
    <Text style={[styles.buttonLabel, { color: primary ? theme.background : theme.text }]}>{title}</Text>
  </Pressable>;
}
export const seconds = (milliseconds: number) => `${(milliseconds / 1000).toFixed(2)}s`;
