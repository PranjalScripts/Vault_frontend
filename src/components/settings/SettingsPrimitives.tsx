import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { useSettingsPalette } from '@/hooks/use-settings-palette';

export type SettingsIconName = ComponentProps<typeof Ionicons>['name'];
export type SettingsTone = 'mint' | 'red' | 'purple' | 'blue' | 'orange' | 'neutral';
export function SettingsIcon({ name, tone = 'mint', small = false }: { name: SettingsIconName; tone?: SettingsTone; small?: boolean }) {
  const p = useSettingsPalette();
  const colors = {
    mint: [p.dark ? '#10392C' : '#E0F4EB', p.dark ? '#4CE6B0' : '#13865F'],
    red: [p.dark ? '#482326' : '#FCE8E9', p.dark ? '#FF7881' : '#C63F4B'],
    purple: [p.dark ? '#302540' : '#EFE7FA', p.dark ? '#D4AAFA' : '#8252AE'],
    blue: [p.dark ? '#102F49' : '#E3EFFB', p.dark ? '#A0CFF8' : '#3374AD'],
    orange: [p.dark ? '#352B20' : '#FFF0E0', p.dark ? '#FF824F' : '#C4582B'],
    neutral: [p.dark ? '#183A2E' : '#E8F0EB', p.dark ? '#E9FFF4' : '#416B57'],
  }[tone];
  return <View accessible={false} style={[styles.icon, small && styles.smallIcon, { backgroundColor: colors[0], borderColor: p.dark ? '#FFFFFF05' : '#00000003' }]}>
    <Ionicons name={name} size={small ? 29 : 34} color={colors[1]} />
  </View>;
}
export function SettingsSwitch({ label, value, disabled, onChange }: { label: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  const p = useSettingsPalette();
  return <Switch accessibilityLabel={label} value={value} disabled={disabled} onValueChange={onChange}
    trackColor={{ false: p.dark ? '#30423C' : '#C8D7CF', true: p.dark ? '#36C997' : '#209C73' }}
    thumbColor={value ? '#FFFFFF' : p.dark ? '#B5C7BE' : '#F8FCFA'} ios_backgroundColor={p.dark ? '#30423C' : '#C8D7CF'}
    style={{ opacity: disabled ? 0.45 : 1 }} />;
}
export function SettingsRow({ title, description, icon, tone, onPress, trailing, footer, compact = false, borderless = false, danger = false, disabled = false }: {
  title: string; description: string; icon: SettingsIconName; tone?: SettingsTone;
  onPress?: () => void; trailing?: ReactNode; footer?: ReactNode; compact?: boolean; borderless?: boolean; danger?: boolean; disabled?: boolean;
}) {
  const p = useSettingsPalette();
  const contents = <>
    <SettingsIcon name={icon} tone={tone} small={compact} />
    <View style={styles.copy}>
      <Text style={[styles.title, compact && styles.compactTitle, { color: danger ? p.danger : p.text }]}>{title}</Text>
      <Text style={[styles.description, compact && styles.compactDescription, { color: p.secondary }]}>{description}</Text>
      {footer}
    </View>
    {trailing ?? (onPress ? <Feather name="chevron-right" size={21} color={p.secondary} /> : null)}
  </>;
  const rowStyle = [styles.row, compact && styles.compactRow, { backgroundColor: borderless ? 'transparent' : p.card, borderColor: borderless ? 'transparent' : p.border, opacity: disabled ? 0.5 : 1 }];
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [...rowStyle, pressed && { backgroundColor: p.inset }]}>{contents}</Pressable>
    : <View style={rowStyle}>{contents}</View>;
}
const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderRadius: 20, padding: 16, minHeight: 104 },
  compactRow: { gap: 13, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 17, minHeight: 82 },
  icon: { width: 62, height: 66, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  smallIcon: { width: 54, height: 58, borderRadius: 15 },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: -0.3 },
  compactTitle: { fontSize: 14, lineHeight: 19 },
  description: { fontSize: 13, lineHeight: 20 },
  compactDescription: { fontSize: 12, lineHeight: 17 },
});
