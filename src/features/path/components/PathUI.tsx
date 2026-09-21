import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
export const label = (value: string) => value === 'turns' ? 'Turn Challenge' : value === 'blocked' ? 'Blocked Cells' : value.charAt(0).toUpperCase() + value.slice(1);
export function PathButton({ title, onPress, primary = false, disabled = false }: { title: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: primary ? theme.accent : theme.backgroundElement, borderColor: theme.border, opacity: disabled ? .45 : pressed ? .7 : 1 }]}>
    <Text style={{ color: primary ? theme.background : theme.text, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: 12, justifyContent: 'center' } });
