import React, { useCallback } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '@/hooks/use-theme';

// Render inside AppLayout: forms replace the content, never the navigation shell.
export function PasscodeEditorShell({ visible, title, onClose, children, busy = false }: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  busy?: boolean;
}) {
  const theme = useTheme();
  useFocusEffect(useCallback(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, busy, onClose]));
  if (!visible) return null;
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: theme.border }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={busy} onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.4 : 1 }}><Feather name="arrow-left" size={24} color={theme.text} /></Pressable>
      <Text accessibilityRole="header" style={{ flex: 1, color: theme.text, fontSize: 20, fontWeight: '700' }}>{title}</Text>
    </View>
    <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, flexGrow: 1 }}>{children}</View>
  </KeyboardAvoidingView>;
}
