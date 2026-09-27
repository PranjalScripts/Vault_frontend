import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { AppLayout } from "./AppLayout";
import { useTheme } from "@/hooks/use-theme";
import {
  useThemePreference,
  setThemePreference,
} from "@/state/theme-preference";
import { useVault } from "@/contexts/vaultContext";
import { logout } from "@/api/api";

const sections = [
  {
    id: "appearance",
    label: "Appearance",
    icon: "sliders",
    description: "Make your workspace feel like yours.",
  },
  {
    id: "security",
    label: "Security",
    icon: "shield",
    description: "Manage the password that protects your vault.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "bell",
    description: "Stay informed, wherever you work.",
  },
  {
    id: "account",
    label: "Account",
    icon: "user",
    description: "Manage your current session.",
  },
] as const;

export function WebSettings() {
  const { showSuccess } = useFeedbackModal();
  const theme = useTheme();
  const preference = useThemePreference();
  const router = useRouter();
  const wide = useWindowDimensions().width >= 1050;
  const [section, setSection] =
    useState<(typeof sections)[number]["id"]>("appearance");
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const selected = sections.find((item) => item.id === section)!;
  const s = createStyles(theme);
  return (
    <AppLayout
      mobileTitle="Settings"
      mobileHeaderActions={<View />}
      desktopBreadcrumb={<Text style={s.breadcrumb}>Workspace / Settings</Text>}
    >
      <View style={s.page}>
        <View style={s.pageHeading}>
          <View style={s.eyebrowRow}>
            <View style={s.mark}>
              <Feather name="settings" size={19} color={theme.accent} />
            </View>
            <Text style={s.eyebrow}>YOUR WORKSPACE</Text>
          </View>
          {/* <Text style={s.title}>Settings</Text> */}
          <Text style={s.lead}>
            A little more personal. A little more productive.
          </Text>
        </View>
        <View style={[s.layout, { flexDirection: wide ? "row" : "column" }]}>
          <View
            style={[
              s.navigation,
              {
                width: wide ? 220 : "100%",
                flexDirection: wide ? "column" : "row",
                flexWrap: "wrap",
              },
            ]}
          >
            {sections.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: section === item.id }}
                onPress={() => {
                  setSection(item.id);
                  setError("");
                }}
                style={({ pressed }) => [
                  s.navItem,
                  {
                    backgroundColor:
                      section === item.id
                        ? theme.accentMuted
                        : pressed
                          ? theme.backgroundSelected
                          : "transparent",
                  },
                ]}
              >
                <Feather
                  name={item.icon}
                  size={18}
                  color={
                    section === item.id ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    s.navLabel,
                    {
                      color:
                        section === item.id
                          ? theme.accent
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {section === item.id && <View style={s.activeDot} />}
              </Pressable>
            ))}
            {wide && (
              <View style={s.sideNote}>
                <Feather name="lock" size={19} color={theme.accent} />
                <Text style={s.sideNoteTitle}>Your space, secured.</Text>
                <Text style={s.description}>
                  Your vault password protects access to your saved passcodes.
                </Text>
              </View>
            )}
          </View>
          <View style={s.content}>
            <View style={s.sectionHeading}>
              <Text style={s.sectionTitle}>{selected.label}</Text>
              <Text style={s.description}>{selected.description}</Text>
            </View>
            {!!error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
            {section === "appearance" && (
              <View style={s.panel}>
                <Text style={s.panelTitle}>Choose your theme</Text>
                <Text style={s.description}>
                  Applies across Vault on this browser. Your choice is saved
                  automatically.
                </Text>
                <View style={s.themeOptions}>
                  {(["light", "dark", "system"] as const).map((value) => {
                    const active = value === preference;
                    const previewDark = value === "dark";
                    return (
                      <Pressable
                        key={value}
                        accessibilityRole="radio"
                        accessibilityLabel={`${value} theme`}
                        accessibilityState={{ checked: active }}
                        onPress={() => {
                          setError("");
                          void (preference === value ? Promise.resolve() : setThemePreference(value).then(() => showSuccess({ title: "Appearance Saved", message: "Your theme preference has been updated." }))).catch(() =>
                            setError(
                              "Theme applied, but could not be saved. Please try again.",
                            ),
                          );
                        }}
                        style={[
                          s.themeOption,
                          { borderColor: active ? theme.accent : theme.border },
                        ]}
                      >
                        <View
                          style={[
                            s.preview,
                            {
                              backgroundColor: previewDark
                                ? "#151D19"
                                : "#FAFBF9",
                            },
                          ]}
                        >
                          <View
                            style={[
                              s.previewSidebar,
                              {
                                backgroundColor: previewDark
                                  ? "#24362B"
                                  : "#E7EFE9",
                              },
                            ]}
                          />
                          <View style={s.previewContent}>
                            <View
                              style={[
                                s.previewLine,
                                {
                                  backgroundColor: previewDark
                                    ? "#4D6857"
                                    : "#D4DFD6",
                                },
                              ]}
                            />
                            <View
                              style={[
                                s.previewBlock,
                                {
                                  backgroundColor: previewDark
                                    ? "#27362D"
                                    : "#EDF2EE",
                                },
                              ]}
                            />
                            {value === "system" && (
                              <View style={s.systemHalf} />
                            )}
                          </View>
                        </View>
                        <View style={s.themeLabel}>
                          <Feather
                            name={
                              value === "light"
                                ? "sun"
                                : value === "dark"
                                  ? "moon"
                                  : "monitor"
                            }
                            size={17}
                            color={theme.text}
                          />
                          <Text style={s.optionTitle}>
                            {value[0].toUpperCase() + value.slice(1)}
                          </Text>
                          <Feather
                            name={active ? "check-circle" : "circle"}
                            size={17}
                            color={active ? theme.accent : theme.border}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={s.note}>
                  <Feather
                    name="monitor"
                    size={17}
                    color={theme.textSecondary}
                  />
                  <Text style={s.description}>
                    System follows your device’s light or dark appearance.
                  </Text>
                </View>
              </View>
            )}
            {section === "security" && <WebPasswordForm />}
            {section === "notifications" && (
              <View style={s.panel}>
                <View style={s.featureIcon}>
                  <Feather name="smartphone" size={26} color={theme.accent} />
                </View>
                <Text style={s.panelTitle}>Reminders on your phone</Text>
                <Text style={s.description}>
                  Task and study reminders are scheduled by the Vault mobile
                  app. Open Settings in the app to choose what to be reminded
                  about and how often.
                </Text>
                <View style={s.note}>
                  <Feather name="info" size={18} color={theme.textSecondary} />
                  <Text style={s.description}>
                    Browser notifications are not currently supported.
                  </Text>
                </View>
              </View>
            )}
            {section === "account" && (
              <View style={s.panel}>
                <Text style={s.panelTitle}>Sign out of this session</Text>
                <Text style={s.description}>
                  Your saved workspace remains in your account. You’ll need to
                  sign in again to access it on this browser.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={signingOut}
                  onPress={async () => {
                    setSigningOut(true);
                    try {
                      await logout();
                      router.replace("/");
                    } catch {
                      setError("Could not sign out. Please try again.");
                    } finally {
                      setSigningOut(false);
                    }
                  }}
                  style={[
                    s.secondaryButton,
                    {
                      alignSelf: "flex-start",
                      marginTop: 22,
                      borderColor: theme.danger,
                    },
                  ]}
                >
                  <Feather name="log-out" size={17} color={theme.danger} />
                  <Text style={{ color: theme.danger, fontWeight: "600" }}>
                    {signingOut ? "Signing out…" : "Sign out"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </AppLayout>
  );
}

function WebPasswordForm() {
  const { showSuccess } = useFeedbackModal();
  const theme = useTheme();
  const s = createStyles(theme);
  const { status, changePassword } = useVault();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const clear = () => {
    setValues({ current: "", next: "", confirm: "" });
    setVisible({});
    setError("");
  };
  const submit = async () => {
    if (pending.current) return;
    if (!values.current) {
      setError("Enter your current vault password.");
      return;
    }
    if (values.next.trim().length < 6) {
      setError("Use at least 6 characters for your new password.");
      return;
    }
    if (values.next !== values.next.trim()) {
      setError("The new password cannot start or end with spaces.");
      return;
    }
    if (values.current === values.next) {
      setError("Choose a different password.");
      return;
    }
    if (values.next !== values.confirm) {
      setError("The new passwords do not match.");
      return;
    }
    pending.current = true;
    setSaving(true);
    setError("");

    try {
      await changePassword(values.current, values.next);
      clear();
      setExpanded(false);
      showSuccess({ title: "Vault Password Changed", message: "Use your new password next time you unlock your vault." });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to update your password. Please try again.",
      );
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  return (
    <View style={s.panel}>
      <View style={s.securityHeader}>
        <View style={s.featureIcon}>
          <Feather name="shield" size={25} color={theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.panelTitle}>Vault password</Text>
          <Text style={s.description}>
            Keep your saved credentials protected.
          </Text>
        </View>
        {!expanded && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              clear();

              setExpanded(true);
            }}
            style={s.secondaryButton}
          >
            <Feather name="key" size={16} color={theme.text} />
            <Text style={s.optionTitle}>Change password</Text>
          </Pressable>
        )}
      </View>
      {expanded &&
        (status === "loading" ? (
          <ActivityIndicator
            accessibilityLabel="Loading vault"
            color={theme.accent}
          />
        ) : status === "setup" ? (
          <View style={s.passwordForm}>
            <Text style={s.description}>
              Create your vault before changing its password.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/passcodes")}
              style={s.primaryButton}
            >
              <Text style={s.primaryText}>Open Passcodes</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.passwordForm}>
            <Text style={s.description}>
              Your saved passcodes stay intact. Updating your password locks the
              vault.
            </Text>
            {(
              [
                { key: "current", label: "Current password" },
                { key: "next", label: "New password" },
                { key: "confirm", label: "Confirm new password" },
              ] as const
            ).map((field) => (
              <View key={field.key} style={s.field}>
                <Text style={s.fieldLabel}>{field.label}</Text>
                <View style={s.inputRow}>
                  <TextInput
                    accessibilityLabel={field.label}
                    value={values[field.key]}
                    onChangeText={(value) => {
                      setValues((previous) => ({
                        ...previous,
                        [field.key]: value,
                      }));
                      setError("");
                    }}
                    placeholder={field.label}
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!visible[field.key]}
                    editable={!saving}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={
                      field.key === "current"
                        ? "current-password"
                        : "new-password"
                    }
                    onSubmitEditing={
                      field.key === "confirm" ? () => void submit() : undefined
                    }
                    style={s.input}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${visible[field.key] ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                    disabled={saving}
                    onPress={() =>
                      setVisible((previous) => ({
                        ...previous,
                        [field.key]: !previous[field.key],
                      }))
                    }
                    style={s.eye}
                  >
                    <Feather
                      name={visible[field.key] ? "eye" : "eye-off"}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
            <Text style={s.description}>
              Use at least 6 characters. A longer, unique password with letters,
              numbers, and symbols is better.
            </Text>
            {!!error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
            <View style={s.formActions}>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => {
                  clear();
                  setExpanded(false);
                }}
                style={s.secondaryButton}
              >
                <Text style={s.optionTitle}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void submit()}
                style={[s.primaryButton, { opacity: saving ? 0.6 : 1 }]}
              >
                {saving ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={s.primaryText}>Update password</Text>
                )}
              </Pressable>
            </View>
          </View>
        ))}
    </View>
  );
}
const createStyles = (t: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    page: {
      width: "100%",
      maxWidth: 1160,
      alignSelf: "center",
      padding: 24,
      paddingBottom: 64,
    },
    breadcrumb: { color: t.textSecondary, fontSize: 13 },
    pageHeading: {
      paddingBottom: 32,
      borderBottomWidth: 1,
      borderColor: t.border,
      marginBottom: 32,
    },
    eyebrowRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      marginBottom: 16,
    },
    mark: { padding: 9, backgroundColor: t.accentMuted, borderRadius: 10 },
    eyebrow: {
      color: t.textSecondary,
      fontSize: 10,
      letterSpacing: 1.8,
      fontWeight: "700",
    },
    title: {
      color: t.text,
      fontSize: 36,
      fontWeight: "700",
      letterSpacing: -1,
    },
    lead: { color: t.textSecondary, fontSize: 15, marginTop: 9 },
    layout: { gap: 40, alignItems: "flex-start" },
    navigation: { gap: 6 },
    navItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 46,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    navLabel: { fontSize: 14, fontWeight: "600" },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: t.accent,
      marginLeft: "auto",
    },
    sideNote: {
      marginTop: 36,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
    },
    sideNoteTitle: { color: t.text, fontSize: 13, fontWeight: "600" },
    content: { flex: 1, width: "100%", minWidth: 0, gap: 20 },
    sectionHeading: { gap: 6 },
    sectionTitle: { color: t.text, fontSize: 23, fontWeight: "600" },
    description: {
      color: t.textSecondary,
      fontSize: 13,
      lineHeight: 21,
      flexShrink: 1,
    },
    panel: {
      backgroundColor: t.backgroundElement,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      padding: 24,
    },
    panelTitle: {
      color: t.text,
      fontSize: 17,
      fontWeight: "600",
      marginBottom: 7,
    },
    themeOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      marginTop: 26,
    },
    themeOption: {
      flex: 1,
      minWidth: 140,
      borderWidth: 2,
      borderRadius: 12,
      overflow: "hidden",
    },
    preview: { height: 104, padding: 12, flexDirection: "row", gap: 8 },
    previewSidebar: { width: 27, borderRadius: 4 },
    previewContent: { flex: 1, gap: 10, overflow: "hidden" },
    previewLine: { width: "60%", height: 7, borderRadius: 3 },
    previewBlock: { flex: 1, borderRadius: 4 },
    systemHalf: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      width: "48%",
      backgroundColor: "#283B30",
      borderRadius: 4,
    },
    themeLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
    },
    optionTitle: {
      color: t.text,
      fontSize: 13,
      fontWeight: "600",
      flexShrink: 1,
    },
    note: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 24,
      paddingTop: 18,
      borderTopWidth: 1,
      borderColor: t.border,
    },
    featureIcon: {
      alignSelf: "flex-start",
      backgroundColor: t.accentMuted,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    primaryButton: {
      alignSelf: "flex-start",
      minHeight: 42,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 18,
      borderRadius: 8,
      backgroundColor: t.accent,
    },
    primaryText: { color: t.background, fontWeight: "600", fontSize: 13 },
    securityHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 16,
    },
    passwordForm: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderColor: t.border,
      gap: 18,
    },
    field: { gap: 8 },
    fieldLabel: { color: t.text, fontSize: 13, fontWeight: "500" },
    inputRow: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.background,
    },
    input: { flex: 1, minWidth: 0, padding: 13, color: t.text, fontSize: 14 },
    eye: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    formActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 10,
      paddingTop: 6,
    },
    error: { color: t.danger, fontSize: 13, lineHeight: 20 },
  });
