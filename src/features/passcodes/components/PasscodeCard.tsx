import { useTheme } from '@/hooks/use-theme';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { BrandLogo } from '@/components/BrandLogo';
import type { Passcode } from '../types';
import { categoryColors, entryCategory } from '../presentation';

type Props = {
  item: Passcode; isRevealed: boolean; copiedField: string | null;
  onOpen: (item: Passcode) => void; onDelete: (id: string) => void; onEdit: (item: Passcode) => void;
  onToggleReveal: (id: string) => void; onCopy: (value: string, id: string, label: string) => void;
};
export function PasscodeCard({ item, isRevealed, copiedField, onOpen, onDelete, onEdit, onToggleReveal, onCopy }: Props) {
  const p = useTheme();
  const s = createStyles(p);
  const [menu, setMenu] = useState(false);
  const category = entryCategory(item);
  return <View style={s.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.platform} details`} onPress={() => onOpen(item)} style={s.identity}>
      <BrandLogo name={item.platform} kind="platform" size={46} />
      <View style={s.copy}><Text numberOfLines={1} style={s.name}>{item.platform}</Text>
        <View style={s.line}><Feather name="user" size={12} color={p.textSecondary} /><Text numberOfLines={1} style={s.username}>{item.username}</Text></View>
        <View style={s.line}><Feather name="lock" size={12} color={p.textSecondary} /><Text numberOfLines={1} style={s.password}>{isRevealed ? item.password : '••••••••'}</Text></View>
      </View>
    </Pressable>
    <View style={s.actions}>
      <View style={s.top}><View style={s.badge}><View style={[s.dot, { backgroundColor: categoryColors[category] }]} /><Text style={s.category}>{category}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Actions for ${item.platform}`} accessibilityState={{ expanded: menu }} onPress={() => setMenu(value => !value)} style={s.more}><Feather name="more-vertical" size={18} color={p.textSecondary} /></Pressable>
      </View>
      <View style={s.bottom}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Copy ${item.platform} password`} disabled={!item.password} onPress={() => onCopy(item.password || '', `${item._id}-password`, 'Password')} style={s.copyButton}><Feather name={copiedField === `${item._id}-password` ? 'check' : 'copy'} size={17} color={p.text} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${isRevealed ? 'Hide' : 'Show'} ${item.platform} password`} onPress={() => onToggleReveal(item._id)} style={s.show}><Feather name={isRevealed ? 'eye-off' : 'eye'} size={17} color={p.link} /><Text style={s.showText}>{isRevealed ? 'Hide' : 'Show'}</Text></Pressable>
      </View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.platform}`} onPress={() => onOpen(item)} style={s.chevron}><Feather name="chevron-right" size={19} color={p.textSecondary} /></Pressable>
    {menu && <View style={s.menu}>
      <Pressable accessibilityRole="button" onPress={() => { setMenu(false); onEdit(item); }} style={s.menuItem}><Feather name="edit-2" size={16} color={p.accent} /><Text style={s.showText}>Edit</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => { setMenu(false); onDelete(item._id); }} style={s.menuItem}><Feather name="trash-2" size={16} color={p.danger} /><Text style={{ color: p.danger }}>Delete</Text></Pressable>
    </View>}
  </View>;
}
const createStyles = (p: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: { width: '100%', minHeight: 82, padding: 12, borderWidth: 1, borderColor: p.border, borderRadius: 16, backgroundColor: p.backgroundElement, flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap' },
  identity: { flex: 1, minWidth: 125, flexDirection: 'row', alignItems: 'center', gap: 16 },
  copy: { flex: 1, minWidth: 0 }, name: { color: p.text, fontWeight: '600', fontSize: 15, marginBottom: 7 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 }, username: { color: p.textSecondary, fontSize: 12, flex: 1 }, password: { color: p.text, fontSize: 14, letterSpacing: 2, flex: 1 },
  actions: { gap: 8 }, top: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 7 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 20, backgroundColor: p.backgroundSelected, paddingHorizontal: 9, paddingVertical: 5 }, dot: { width: 8, height: 8, borderRadius: 4 }, category: { color: p.textSecondary, fontSize: 10 },
  more: { width: 26, minHeight: 28, alignItems: 'center', justifyContent: 'center' }, bottom: { flexDirection: 'row', gap: 9 },
  copyButton: { minWidth: 36, minHeight: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: p.backgroundSelected, borderWidth: 1, borderColor: p.border },
  show: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 30, paddingHorizontal: 10, borderRadius: 10, backgroundColor: p.accentMuted, borderWidth: 1, borderColor: p.border }, showText: { color: p.link, fontSize: 12 },
  chevron: { width: 18, minHeight: 44, justifyContent: 'center' },
  menu: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: p.border, paddingTop: 8 }, menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
});
