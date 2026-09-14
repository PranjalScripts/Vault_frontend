import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useVault } from "@/contexts/vaultContext";
import { useTheme } from "@/hooks/use-theme";

export function ChangeVaultPassword() {
  const theme = useTheme();
  const router = useRouter();
  const { status, changePassword } = useVault();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const submitting = useRef(false);
  const clear = () => { setCurrentPassword(""); setNewPassword(""); setConfirmation(""); setShowPasswords(false); setError(""); };
  const submit = async () => {
    if (submitting.current) return;
    if (!currentPassword) { setError("Enter your current vault password."); return; }
    if (newPassword.trim().length < 4) { setError("Use at least 4 characters for your new password."); return; }
    if (newPassword !== newPassword.trim()) { setError("The new password cannot start or end with spaces."); return; }
    if (newPassword === currentPassword) { setError("Choose a different password."); return; }
    if (newPassword !== confirmation) { setError("The new passwords do not match."); return; }
    submitting.current = true;
    setSaving(true); setError(""); setSuccess(false);
    try {
      await changePassword(currentPassword, newPassword);
      clear(); setOpen(false); setSuccess(true);
    } catch (failure: unknown) {
      const apiError = failure as { response?: { data?: { message?: string } }; message?: string };
      setError(apiError.response?.data?.message || apiError.message || "Unable to change the password. Please try again.");
    } finally { submitting.current = false; setSaving(false); }
  };

  return <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Change vault password" accessibilityState={{ expanded: open, disabled: saving }} disabled={saving}
      onPress={() => { clear(); setSuccess(false); setOpen(value => !value); }} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: theme.accentMuted }]}><Feather name="key" size={20} color={theme.accent} /></View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>Change vault password</Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>Update the password used to unlock your passcodes.</Text>
      </View>
      <Feather name={open ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
    </Pressable>
    {success && <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: theme.accent }]}>Vault password updated. Use your new password next time you unlock your vault.</Text>}
    {open && <View style={[styles.form, { borderTopColor: theme.border }]}>
      {status === "loading" ? <ActivityIndicator accessibilityLabel="Loading vault" color={theme.accent} />
        : status === "setup" ? <>
          <Text style={[styles.detail, { color: theme.textSecondary }]}>Create your vault in Passcodes before changing its password.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/passcodes")}><Text style={{ color: theme.accent, fontWeight: "600" }}>Open Passcodes</Text></Pressable>
        </> : <>
          <Text style={[styles.detail, { color: theme.textSecondary }]}>Your saved passcodes stay intact. The vault will lock after the password is changed.</Text>
          {[
            { label: "Current vault password", value: currentPassword, set: setCurrentPassword },
            { label: "New vault password", value: newPassword, set: setNewPassword },
            { label: "Confirm new password", value: confirmation, set: setConfirmation },
          ].map(field => <View key={field.label} style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>{field.label}</Text>
            <TextInput accessibilityLabel={field.label} value={field.value} onChangeText={value => { field.set(value); setError(""); }}
              secureTextEntry={!showPasswords} editable={!saving} autoCapitalize="none" autoCorrect={false} autoComplete="off"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
          </View>)}
          <Pressable accessibilityRole="checkbox" accessibilityLabel="Show passwords" accessibilityState={{ checked: showPasswords }} onPress={() => setShowPasswords(value => !value)} style={styles.show}>
            <Feather name={showPasswords ? "eye-off" : "eye"} size={18} color={theme.textSecondary} />
            <Text style={[styles.detail, { color: theme.textSecondary }]}>{showPasswords ? "Hide passwords" : "Show passwords"}</Text>
          </Pressable>
          {!!error && <Text accessibilityRole="alert" style={[styles.detail, { color: theme.danger }]}>{error}</Text>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => { clear(); setOpen(false); }} style={[styles.button, { borderColor: theme.border, borderWidth: 1 }]}><Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Update vault password" accessibilityState={{ disabled: saving }} disabled={saving} onPress={submit} style={[styles.button, { backgroundColor: theme.accent, opacity: saving ? 0.65 : 1 }]}>
              {saving ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background, fontWeight: "600" }}>Update password</Text>}
            </Pressable>
          </View>
        </>}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: 720, alignSelf: "center", borderWidth: 1, borderRadius: 16, padding: 20, marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  detail: { fontSize: 13, lineHeight: 20 },
  form: { borderTopWidth: 1, marginTop: 16, paddingTop: 16, gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, minHeight: 48, paddingHorizontal: 12, fontSize: 16 },
  show: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 36 },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 10 },
  button: { minHeight: 46, paddingHorizontal: 16, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  notice: { fontSize: 13, lineHeight: 20, marginTop: 16 },
});
