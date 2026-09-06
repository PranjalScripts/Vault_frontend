import React from "react";
import { Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
              <View
                style={[
                  styles.brandMarkInner,
                  { backgroundColor: theme.background },
                ]}
              />
            </View>
            <Text style={[styles.brandName, { color: theme.text }]}>vault</Text>
          </View>
          <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>
            YOUR SPACE
          </Text>
        </View>

        <View style={styles.main}>
          <View
            style={[styles.eyebrow, { backgroundColor: theme.accentMuted }]}
          >
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.eyebrowText, { color: theme.accent }]}>
              A calmer way to learn
            </Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Keep what{`\n`}matters close.
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            A simple home for the subjects and ideas you want to return to.
          </Text>

          <View
            style={[
              styles.preview,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[styles.previewOrbit, { borderColor: theme.accent }]}
            />
            <View
              style={[styles.previewCore, { backgroundColor: theme.accent }]}
            />
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[styles.previewLabel, { color: theme.textSecondary }]}
              >
                YOUR VAULT
              </Text>
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                Subjects
              </Text>
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: theme.accentMuted },
                ]}
              />
              <View style={styles.previewMeta}>
                <View
                  style={[styles.previewDot, { backgroundColor: "#D98F66" }]}
                />
                <Text
                  style={[styles.previewText, { color: theme.textSecondary }]}
                >
                  Ideas worth keeping
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            Your personal library, always within reach.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your subjects"
            onPress={() => router.push("/onboarding" as Href)}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.buttonText}>Open your vault</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 18 },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 27,
    height: 27,
    borderRadius: 8,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkInner: { width: 10, height: 10, borderRadius: 3 },
  brandName: { fontSize: 22, fontWeight: "700", letterSpacing: -0.8 },
  headerLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  main: { flex: 1, justifyContent: "center", paddingBottom: 18 },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 11,
    marginBottom: 18,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  eyebrowText: { fontSize: 11, fontWeight: "700" },
  title: {
    fontSize: 46,
    lineHeight: 48,
    fontWeight: "700",
    letterSpacing: -1.8,
  },
  description: { fontSize: 15, lineHeight: 23, marginTop: 18, maxWidth: 320 },
  preview: {
    height: 212,
    marginTop: 30,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  previewOrbit: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    opacity: 0.45,
    right: -74,
    bottom: -104,
  },
  previewCore: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.12,
    left: -66,
    top: -74,
  },
  previewCard: {
    width: "78%",
    padding: 18,
    borderWidth: 1,
    transform: [{ rotate: "-3deg" }],
  },
  previewLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 17,
  },
  previewTitle: { fontSize: 25, fontWeight: "700", marginBottom: 16 },
  previewLine: { height: 4, width: "70%", marginBottom: 13 },
  previewMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  previewText: { fontSize: 11 },
  footer: { gap: 12 },
  footerNote: { fontSize: 11 },
  button: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  buttonArrow: { color: "#FFFFFF", fontSize: 22 },
});
