import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { sendVaultPasswordOtp } from '@/api/endpoints';
import { useTheme } from '@/hooks/use-theme';

export function VaultPasswordOtp({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const theme = useTheme();
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining(v => Math.max(0, v - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  const send = async () => {
    if (pending.current || remaining || disabled) return;
    pending.current = true; setSending(true); setError('');
    try {
      await sendVaultPasswordOtp(); onChange(''); setRemaining(30);
      setMessage('Code sent to your account email. It expires in 5 minutes.');
    } catch (failure: unknown) {
      const e = failure as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Unable to send the code. Please try again.');
    } finally { pending.current = false; setSending(false); }
  };
  return <View style={{ gap: 10 }}>
    <Text style={{ color: theme.text, fontWeight: '600' }}>Email verification</Text>
    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>Confirm this change with a code sent to your account email.</Text>
    <Pressable accessibilityRole="button" disabled={disabled || sending || remaining > 0} onPress={() => void send()} style={{ minHeight: 44, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, alignItems: 'center', opacity: disabled || sending || remaining > 0 ? 0.6 : 1 }}>
      {sending ? <ActivityIndicator color={theme.accent} /> : <Text style={{ color: theme.accent, fontWeight: '600' }}>{remaining ? `Resend in ${remaining}s` : message ? 'Resend email code' : 'Send email code'}</Text>}
    </Pressable>
    <TextInput accessibilityLabel="Email verification code" placeholder="6-digit code" placeholderTextColor={theme.textSecondary} value={value} onChangeText={text => onChange(text.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} editable={!disabled && !sending} style={{ color: theme.text, borderColor: theme.border, borderWidth: 1, borderRadius: 12, minHeight: 50, padding: 14, fontSize: 20, letterSpacing: 5 }} />
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary, fontSize: 12 }}>{message}</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: theme.danger, fontSize: 13 }}>{error}</Text>}
  </View>;
}
