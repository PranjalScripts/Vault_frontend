import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
export function Countdown({ value, local }: { value: number; local: boolean }) {
  const content = value === 0 ? 'TAP!' : String(value);
  return <View pointerEvents="none" style={s.overlay} accessibilityLiveRegion="assertive" accessibilityLabel={content}>
    {local && <Text style={[s.text, { transform: [{ rotate: '180deg' }] }]}>{content}</Text>}
    <Text style={s.text}>{content}</Text>
  </View>;
}
const s = StyleSheet.create({ overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 20 }, text: { color: '#FFFFFF', fontSize: 76, fontWeight: '900', letterSpacing: 2, textShadowColor: '#00000033', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } } });
