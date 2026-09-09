import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { AppLayout } from "@/components/AppLayout";
import { useTheme } from "@/hooks/use-theme";
import {
  setThemePreference,
  useThemePreference,
} from "@/state/theme-preference";

const options = [
  {
    value: "light",
    label: "Light",
    detail: "A bright appearance for your workspace.",
    icon: "sun",
  },
  {
    value: "dark",
    label: "Dark",
    detail: "A darker appearance for your workspace.",
    icon: "moon",
  },
  {
    value: "system",
    label: "System",
    detail: "Match your device’s appearance.",
    icon: "monitor",
  },
] as const;

export default function SettingsScreen() {
  const theme = useTheme();
  const preference = useThemePreference();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const selectedOption =
    options.find((option) => option.value === preference) ?? options[2];
  return (
    <AppLayout
      title="Settings"
      mobileTitle="Settings"
      subtitle="Make Vault feel right for you."
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: appearanceOpen }}
          accessibilityLabel="Appearance"
          onPress={() => setAppearanceOpen((open) => !open)}
          style={({ pressed }) => [
            styles.appearanceRow,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View
            style={[
              styles.appearanceIcon,
              { backgroundColor: theme.accentMuted },
            ]}
          >
            <Feather name="sliders" size={20} color={theme.accent} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>
              Appearance
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {selectedOption.label} theme
            </Text>
          </View>
          <Feather
            name={appearanceOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>
        {appearanceOpen && (
          <View style={[styles.options, { borderTopColor: theme.border }]}>
            <Text style={[styles.optionsTitle, { color: theme.textSecondary }]}>
              Choose how Vault looks on this device.
            </Text>
            {options.map((option) => {
              const selected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${option.label} theme`}
                  onPress={() => {
                    void setThemePreference(option.value).catch(() =>
                      Alert.alert(
                        "Theme not saved",
                        "Your theme is applied, but could not be saved for your next visit.",
                      ),
                    );
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      borderColor: selected ? theme.accent : theme.border,
                      backgroundColor: selected
                        ? theme.accentMuted
                        : theme.backgroundElement,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={option.icon}
                    size={22}
                    color={selected ? theme.accent : theme.textSecondary}
                  />
                  <View style={styles.copy}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[styles.detail, { color: theme.textSecondary }]}
                    >
                      {option.detail}
                    </Text>
                  </View>
                  <Feather
                    name={selected ? "check-circle" : "circle"}
                    size={20}
                    color={selected ? theme.accent : theme.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </AppLayout>
  );
}
const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  appearanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  appearanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  options: { borderTopWidth: 1, marginTop: 16, paddingTop: 16, gap: 12 },
  optionsTitle: { fontSize: 12, lineHeight: 18 },
  title: { fontSize: 20, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 6 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  label: { fontSize: 14, fontWeight: "600" },
  detail: { fontSize: 12, lineHeight: 18 },
});
