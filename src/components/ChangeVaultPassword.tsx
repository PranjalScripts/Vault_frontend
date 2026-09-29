import { VaultPasswordOtp } from "./VaultPasswordOtp";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useVault } from "@/contexts/vaultContext";
import { useTheme } from "@/hooks/use-theme";
import { useSettingsPalette } from "@/hooks/use-settings-palette";

export function ChangeVaultPassword() {
  const { showSuccess } = useFeedbackModal();
  const baseTheme = useTheme();
  const p = useSettingsPalette();
  const theme = { ...baseTheme, backgroundElement: p.card, text: p.text, textSecondary: p.secondary, accent: p.accent, accentMuted: p.mint, border: p.border };
  const router = useRouter();
  const { status, changePassword } = useVault();
  const [otp, setOtp] = useState("");
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const clear = () => { setOtp(""); setCurrentPassword(""); setNewPassword(""); setConfirmation(""); setVisible({}); setFocused(null); setError(""); };
  const submit = async () => {
    if (submitting.current) return;
    if (!currentPassword) { setError("Enter your current vault password."); return; }
    if (newPassword.trim().length < 6) { setError("Use at least 6 characters for your new password."); return; }
    if (newPassword !== newPassword.trim()) { setError("The new password cannot start or end with spaces."); return; }
    if (newPassword === currentPassword) { setError("Choose a different password."); return; }
    if (newPassword !== confirmation) { setError("The new passwords do not match."); return; }
    if (!/^\d{6}$/.test(otp)) { setError("Enter the 6-digit code sent to your email."); return; }
    submitting.current = true;
    setSaving(true); setError("");
    try {
      await changePassword(currentPassword, newPassword, otp);
      clear(); setOpen(false); showSuccess({ title: "Vault Password Changed", message: "Use your new password next time you unlock your vault." });
    } catch (failure: unknown) {
      const apiError = failure as { response?: { data?: { message?: string } }; message?: string };
      setError(apiError.response?.data?.message || apiError.message || "Unable to change the password. Please try again.");
    } finally { submitting.current = false; setSaving(false); }
  };

  const close = () => { if (!submitting.current) { clear(); setOpen(false); } };
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(rule => rule.test(newPassword)).length;
  const strength = !newPassword ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 || variety < 2 ? 2 : newPassword.length < 14 || variety < 3 ? 3 : 4;
  const strengthLabel = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Change vault password" accessibilityState={{ expanded: open, disabled: saving }} disabled={saving}
      onPress={() => { clear();  setOpen(true); }} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: theme.accentMuted }]}><Feather name="key" size={25} color={theme.accent} /></View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>Change vault password</Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>Update the password used to unlock your passcodes.</Text>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
    <Modal visible={open} animationType="none" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaView style={[styles.screen, { backgroundColor: p.background }]}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back to settings" disabled={saving} onPress={close} style={styles.back}><Feather name="arrow-left" size={27} color={p.text} /></Pressable>
              <View style={styles.copy}><Text accessibilityRole="header" style={[styles.heading, { color: p.text }]}>Change Vault Password</Text><Text style={[styles.subtitle, { color: p.secondary }]}>Update the password used to unlock your passcodes.</Text></View>
            </View>
            <View style={[styles.hero, { backgroundColor: p.dark ? p.mint : '#EAF4EF' }]}>
              <Image source={require('@/assets/images/password-shield.png')} style={styles.shield} accessibilityIgnoresInvertColors accessible={false} />
              <View style={styles.heroCopy}><Text style={[styles.heroTitle, { color: p.text }]}>Keep your data secure</Text><Text style={[styles.heroDescription, { color: p.secondary }]}>Choose a strong password to protect your vault and keep your information safe.</Text></View>
              <View style={styles.badges}>
                {([['lock', 'Encrypted\nvault'], ['eye-off', 'Private\npassword'], ['user', 'Your secure\naccess']] as const).map(([icon, text]) => <View key={icon} style={styles.badge}><Feather name={icon} size={18} color={p.accent} /><Text style={[styles.badgeText, { color: p.secondary }]}>{text}</Text></View>)}
              </View>
            </View>
            <View style={[styles.form, { backgroundColor: p.card }]}>
              {status === 'loading' ? <ActivityIndicator accessibilityLabel="Loading vault" color={p.accent} /> : status === 'setup' ? <View style={styles.field}>
                <Text style={[styles.subtitle, { color: p.secondary }]}>Create your vault in Passcodes before changing its password.</Text>
                <Pressable accessibilityRole="button" onPress={() => { close(); router.push('/passcodes'); }} style={[styles.button, { backgroundColor: p.accent }]}><Text style={{ color: p.card, fontWeight: '600' }}>Open Passcodes</Text></Pressable>
              </View> : <>
                {[
                  { key: 'current', label: 'Current vault password', placeholder: 'Enter current password', value: currentPassword, set: setCurrentPassword },
                  { key: 'new', label: 'New vault password', placeholder: 'Enter new password', value: newPassword, set: setNewPassword },
                  { key: 'confirm', label: 'Confirm new password', placeholder: 'Re-enter new password', value: confirmation, set: setConfirmation },
                ].map(field => <View key={field.key} style={styles.field}>
                  <Text style={[styles.label, { color: p.text }]}>{field.label}</Text>
                  <View style={[styles.inputWrap, { backgroundColor: p.dark ? p.inset : '#F8F8FA', borderColor: focused === field.key ? p.accent : p.dark ? p.border : '#DFE0E6' }]}>
                    <Feather name="lock" size={22} color={p.secondary} />
                    <TextInput accessibilityLabel={field.label} placeholder={field.placeholder} placeholderTextColor={p.dark ? '#89978F' : '#9699A3'} value={field.value}
                      onChangeText={value => { field.set(value); setError(''); }} secureTextEntry={!visible[field.key]} editable={!saving} autoCapitalize="none" autoCorrect={false}
                      autoComplete={field.key === 'current' ? 'current-password' : 'new-password'} onFocus={() => setFocused(field.key)} onBlur={() => setFocused(null)}
                      onSubmitEditing={field.key === 'confirm' ? () => void submit() : undefined} returnKeyType={field.key === 'confirm' ? 'done' : 'next'}
                      style={[styles.input, { color: p.text }]} />
                    <Pressable accessibilityRole="button" accessibilityLabel={`${visible[field.key] ? 'Hide' : 'Show'} ${field.label.toLowerCase()}`} accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => setVisible(value => ({ ...value, [field.key]: !value[field.key] }))} style={styles.eye}><Feather name={visible[field.key] ? 'eye' : 'eye-off'} size={21} color={p.secondary} /></Pressable>
                  </View>
                  {field.key === 'new' && <View accessibilityLabel={`Password strength: ${newPassword ? strengthLabel : 'No password entered'}`} style={styles.strength}>
                    <View style={styles.bars}>{[1, 2, 3, 4].map(level => <View key={level} style={[styles.bar, { backgroundColor: level <= strength ? '#08A564' : p.dark ? p.border : '#E4E5E9' }]} />)}</View>
                    <Text style={[styles.strengthLabel, { color: p.secondary }]}>{strengthLabel}</Text>
                  </View>}
                </View>)}
                <View style={[styles.tips, { backgroundColor: p.dark ? p.mint : '#EAF4EF' }]}>
                  <View style={styles.tipIcon}><Feather name="shield" size={25} color={p.accent} /><Feather name="check" size={12} color={p.accent} style={styles.shieldCheck} /></View>
                  <View style={styles.copy}><Text style={[styles.tipsTitle, { color: p.accent }]}>Password tips</Text>
                    {['Use at least 6 characters (longer is better)', 'Include a mix of letters, numbers and symbols', 'Avoid using personal information', 'Use a unique password not used elsewhere'].map(tip => <View key={tip} style={styles.tipRow}><Text style={[styles.bullet, { color: p.text }]}>•</Text><Text style={[styles.tipText, { color: p.dark ? p.secondary : '#3B484D' }]}>{tip}</Text></View>)}
                  </View>
                </View>
                <VaultPasswordOtp value={otp} onChange={setOtp} disabled={saving} />
                {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { color: theme.danger }]}>{error}</Text>}
                <Pressable accessibilityRole="button" accessibilityLabel="Update vault password" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => void submit()} style={({ pressed }) => [styles.button, { backgroundColor: p.dark ? '#29674F' : '#1B5844', opacity: saving || pressed ? 0.7 : 1 }]}>
                  {saving ? <ActivityIndicator accessibilityLabel="Updating password" color="#FFFFFF" /> : <><Text style={styles.buttonText}>Update Password</Text><Feather name="arrow-right" size={25} color="#FFFFFF" style={styles.buttonArrow} /></>}
                </Pressable>
              </>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 720, alignSelf: 'center', borderWidth: 1, borderRadius: 18, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: '600', letterSpacing: -0.5 },
  detail: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  notice: { fontSize: 12, lineHeight: 17, marginTop: 16 },
  screen: { flex: 1 },
  page: { width: '100%', maxWidth: 752, alignSelf: 'center', paddingHorizontal: 14, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingTop: 14, paddingBottom: 22 },
  back: { width: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 21, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  hero: { borderRadius: 17, minHeight: 148, padding: 20, overflow: 'hidden', marginBottom: 14 },
  heroCopy: { width: '68%' },
  heroTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.6 },
  heroDescription: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  shield: { position: 'absolute', right: 5, top: 9, width: '31%', height: 116, borderRadius: 30, resizeMode: 'contain' },
  badges: { flexDirection: 'row', gap: 13, marginTop: 23, width: '78%', flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  badgeText: { fontSize: 10, lineHeight: 13 },
  form: { borderRadius: 18, padding: 18, paddingTop: 20, gap: 24 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', letterSpacing: -0.3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, minHeight: 54, paddingLeft: 16, paddingRight: 4, gap: 14 },
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 14 },
  eye: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  strength: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 4 },
  bars: { flex: 1, flexDirection: 'row', gap: 5 },
  bar: { flex: 1, height: 6, borderRadius: 4 },
  strengthLabel: { fontSize: 11, width: 40, textAlign: 'right' },
  tips: { borderRadius: 16, padding: 18, flexDirection: 'row', gap: 16, marginTop: -2 },
  tipIcon: { width: 27, height: 30, marginTop: 1 },
  shieldCheck: { position: 'absolute', top: 6, left: 6 },
  tipsTitle: { fontSize: 15, fontWeight: '600', marginBottom: 9 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  bullet: { fontSize: 16, lineHeight: 18 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  error: { fontSize: 13, lineHeight: 18, marginTop: -10 },
  button: { minHeight: 54, paddingHorizontal: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: -5 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', letterSpacing: -0.4 },
  buttonArrow: { position: 'absolute', right: 20 },
});
