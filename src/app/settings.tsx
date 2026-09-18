import { WebSettings } from "@/components/WebSettings";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ChangeVaultPassword } from "@/components/ChangeVaultPassword";
import ReminderSettings from "@/components/ReminderSettings";
import { AppLayout } from "@/components/AppLayout";
import { useSettingsPalette } from "@/hooks/use-settings-palette";
import {
  setThemePreference,
  useThemePreference,
} from "@/state/theme-preference";
import { logout } from "@/api/api";

const options = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "monitor" },
] as const;

export default function SettingsScreen() {
  return Platform.OS === "web" ? <WebSettings /> : <AppSettingsScreen />;
}

function AppSettingsScreen() {
  const p = useSettingsPalette();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const preference = useThemePreference();
  const [signingOut, setSigningOut] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(true);
  const selected =
    options.find((option) => option.value === preference) ?? options[2];
  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/dashboard")
        }
        style={styles.back}
      >
        <Feather name="arrow-left" size={26} color={p.text} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={[styles.heading, { color: p.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: p.secondary }]}>
          Make Vault work the way you want.
        </Text>
      </View>
    </View>
  );
  const card = { backgroundColor: p.card, borderColor: p.border };
  return (
    <AppLayout mobileHeader={header} contentBackgroundColor={p.background}>
      <View style={styles.page}>
        {width >= 768 && header}
        <ImageBackground
          source={require("@/assets/images/settings-banner.png")}
          resizeMode="stretch"
          style={styles.banner}
          imageStyle={styles.bannerImage}
        >
          <Text style={styles.bannerTitle}>Your space.{"\n"}Your rules.</Text>
          <Text style={styles.bannerSubtitle}>
            Customize, secure and stay productive.
          </Text>
        </ImageBackground>
        <ReminderSettings />
        <View style={[styles.card, card]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Appearance"
            accessibilityState={{ expanded: appearanceOpen }}
            onPress={() => setAppearanceOpen((value) => !value)}
            style={styles.row}
          >
            <View
              style={[
                styles.icon,
                { backgroundColor: p.dark ? "#362C50" : "#F0EBFF" },
              ]}
            >
              <Ionicons
                name="color-palette-outline"
                size={25}
                color={p.dark ? "#C8B4FF" : "#49259A"}
              />
            </View>
            <View style={styles.copy}>
              <View style={styles.appearanceTitle}>
                <Text style={[styles.title, { color: p.text }]}>
                  Appearance
                </Text>
                <Text style={[styles.themeLabel, { color: p.secondary }]}>
                  {selected.label} theme
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: p.secondary }]}>
                Choose your theme and visual style.
              </Text>
            </View>
            <Feather name="chevron-right" size={19} color={p.secondary} />
          </Pressable>
          {appearanceOpen && (
            <View style={styles.options}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} theme`}
                  accessibilityState={{ checked: preference === option.value }}
                  onPress={() =>
                    void setThemePreference(option.value).catch(() =>
                      Alert.alert(
                        "Theme not saved",
                        "Your theme is applied, but could not be saved for your next visit.",
                      ),
                    )
                  }
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        preference === option.value ? p.mint : p.inset,
                      borderColor:
                        preference === option.value ? p.accent : "transparent",
                    },
                  ]}
                >
                  {preference === option.value && (
                    <View style={[styles.check, { backgroundColor: p.accent }]}>
                      <Feather name="check" size={11} color={p.card} />
                    </View>
                  )}
                  <Feather name={option.icon} size={25} color={p.text} />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color:
                          preference === option.value ? p.text : p.secondary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <ChangeVaultPassword />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (Platform.OS === "web") {
              Alert.alert(
                "Phone notifications",
                "Open Vault on your phone to manage notification permissions.",
              );
              return;
            }
            void Linking.openSettings().catch(() =>
              Alert.alert(
                "Phone notifications",
                "Open your phone’s Settings to manage Vault notifications.",
              ),
            );
          }}
          style={({ pressed }) => [
            styles.card,
            styles.row,
            card,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View
            style={[
              styles.icon,
              { backgroundColor: p.dark ? "#253C55" : "#E6F0FF" },
            ]}
          >
            <Feather
              name="smartphone"
              size={25}
              color={p.dark ? "#A6CCF4" : "#2C6098"}
            />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: p.text }]}>
              Phone notifications
            </Text>
            <Text style={[styles.subtitle, { color: p.secondary }]}>
              Manage notification permissions{"\n"}for the app.
            </Text>
          </View>
          <Feather name="chevron-right" size={19} color={p.secondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out of Vault"
          accessibilityState={{ disabled: signingOut }}
          disabled={signingOut}
          onPress={async () => {
            setSigningOut(true);
            try {
              await logout();
              router.replace("/");
            } catch {
              Alert.alert(
                "Could not sign out",
                "Please try signing out again.",
              );
            } finally {
              setSigningOut(false);
            }
          }}
          style={({ pressed }) => [
            styles.logout,
            {
              backgroundColor: p.dark ? "#482828" : "#FADDDD",
              opacity: signingOut || pressed ? 0.6 : 1,
            },
          ]}
        >
          <Feather
            name="log-out"
            size={24}
            color={p.dark ? "#FF9999" : "#D51F24"}
          />
          <Text
            style={[
              styles.logoutText,
              { color: p.dark ? "#FF9999" : "#D51F24" },
            ]}
          >
            {signingOut ? "Logging out…" : "Logout"}
          </Text>
        </Pressable>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 752,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  back: { width: 34, minHeight: 44, justifyContent: "center" },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.7,
    marginBottom: 2,
  },
  copy: { flex: 1, minWidth: 0 },
  banner: {
    aspectRatio: 3.6,
    minHeight: 104,
    justifyContent: "center",
    paddingHorizontal: 22,
    marginBottom: 4,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#12382C",
  },
  bannerImage: { borderRadius: 12 },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 26,
    letterSpacing: -0.6,
  },
  bannerSubtitle: { color: "#E4EBE6", fontSize: 11, marginTop: 6 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "600", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  appearanceTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    flexWrap: "wrap",
  },
  themeLabel: { fontSize: 11 },
  options: {
    flexDirection: "row",
    gap: 6,
    marginTop: 13,
    paddingHorizontal: 3,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 11,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  optionLabel: { fontSize: 12 },
  check: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logout: {
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 1,
  },
  logoutText: { fontSize: 17, fontWeight: "600" },
});
