import React from "react";
import { Href, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

export default function WebHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const openSubjects = () => router.push("/onboarding" as Href);

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.nav}>
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
            <View
              style={[
                styles.brandMarkInner,
                { backgroundColor: theme.background },
              ]}
            />
          </View>
          <Text style={[styles.brandText, { color: theme.text }]}>vault</Text>
        </View>
        <View style={styles.navLinks}>
          <Text style={[styles.navLink, { color: theme.textSecondary }]}>
            A personal knowledge space
          </Text>
          <Pressable
            onPress={openSubjects}
            style={({ pressed }) => [
              styles.navCta,
              { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.navCtaText}>Enter vault</Text>
            <Text style={styles.navCtaArrow}>↗</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTopline}>
          <Text style={[styles.heroIndex, { color: theme.accent }]}>
            01 / THE BEGINNING
          </Text>
          <View style={[styles.topline, { backgroundColor: theme.border }]} />
        </View>
        <Text style={[styles.heroTitle, { color: theme.text }]}>
          Make room for{`\n`}what fascinates you.
        </Text>
        <View style={styles.heroBottom}>
          <Text
            style={[styles.heroDescription, { color: theme.textSecondary }]}
          >
            A considered place to collect the subjects, questions, and
            half-formed ideas you want to keep close.
          </Text>
          <Pressable
            onPress={openSubjects}
            style={({ pressed }) => [
              styles.heroLink,
              { borderBottomColor: theme.accent, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={[styles.heroLinkText, { color: theme.text }]}>
              Browse your subjects
            </Text>
            <Text style={[styles.heroLinkArrow, { color: theme.accent }]}>
              →
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.canvas, { backgroundColor: theme.accent }]}>
        <View style={styles.canvasHeader}>
          <Text style={styles.canvasLabel}>
            A SMALL SYSTEM FOR BIG CURIOSITY
          </Text>
          <Text style={styles.canvasCount}>VAULT / 2026</Text>
        </View>
        <View style={styles.canvasBody}>
          <View style={styles.canvasCircle} />
          <View style={styles.canvasCopy}>
            <Text style={styles.canvasTitle}>
              Your ideas{`\n`}deserve an address.
            </Text>
            <Text style={styles.canvasDescription}>
              Start with one subject. Follow it somewhere interesting.
            </Text>
          </View>
          <View style={styles.canvasIndex}>
            <Text style={styles.canvasIndexNumber}>04</Text>
            <Text style={styles.canvasIndexLabel}>ACTIVE{`\n`}SUBJECTS</Text>
          </View>
        </View>
        <View style={styles.canvasFooter}>
          <Text style={styles.canvasFooterText}>
            COLLECT / CONNECT / RETURN
          </Text>
          <View style={styles.canvasRule} />
          <Text style={styles.canvasFooterText}>SCROLL TO EXPLORE ↓</Text>
        </View>
      </View>

      <View style={styles.manifesto}>
        <Text style={[styles.manifestoLabel, { color: theme.accent }]}>
          WHY VAULT
        </Text>
        <Text style={[styles.manifestoTitle, { color: theme.text }]}>
          The best ideas are{`\n`}the ones you revisit.
        </Text>
        <View style={styles.manifestoColumns}>
          <ManifestoItem
            number="01"
            title="Collect without clutter"
            body="Give every interest a clear place to land, without turning curiosity into a chore."
            theme={theme}
          />
          <ManifestoItem
            number="02"
            title="Follow the thread"
            body="Subjects make it easier to see connections and keep going a little deeper."
            theme={theme}
          />
          <ManifestoItem
            number="03"
            title="Keep the door open"
            body="Your library grows at your pace, ready whenever a new question arrives."
            theme={theme}
          />
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          styles.navCta,
        </Text>
        <Pressable onPress={openSubjects}>
          <Text style={[styles.footerLink, { color: theme.accent }]}>
            Open your subjects ↗
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ManifestoItem({
  number,
  title,
  body,
  theme,
}: {
  number: string;
  title: string;
  body: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.manifestoItem, { borderTopColor: theme.border }]}>
      <Text style={[styles.itemNumber, { color: theme.accent }]}>{number}</Text>
      <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.itemBody, { color: theme.textSecondary }]}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 52,
    paddingBottom: 42,
  },
  nav: {
    height: 104,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkInner: { width: 12, height: 12, borderRadius: 3 },
  brandText: { fontSize: 24, fontWeight: "700", letterSpacing: -1 },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 28 },
  navLink: { fontSize: 13 },
  navCta: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
  },
  navCtaText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  navCtaArrow: { color: "#FFFFFF", fontSize: 17 },
  hero: { paddingTop: 74, paddingBottom: 94, maxWidth: 1000 },
  heroTopline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
  },
  heroIndex: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  topline: { height: 1, flex: 1 },
  heroTitle: {
    fontSize: 78,
    lineHeight: 79,
    fontWeight: "700",
    letterSpacing: -3.2,
  },
  heroBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 46,
    gap: 32,
  },
  heroDescription: { maxWidth: 360, fontSize: 16, lineHeight: 25 },
  heroLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderBottomWidth: 1,
    paddingBottom: 9,
  },
  heroLinkText: { fontSize: 14, fontWeight: "700" },
  heroLinkArrow: { fontSize: 22 },
  canvas: { minHeight: 440, padding: 30, justifyContent: "space-between" },
  canvasHeader: { flexDirection: "row", justifyContent: "space-between" },
  canvasLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  canvasCount: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  canvasBody: {
    flex: 1,
    minHeight: 300,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  canvasCircle: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  canvasCopy: { alignItems: "center" },
  canvasTitle: {
    color: "#FFFFFF",
    fontSize: 45,
    lineHeight: 45,
    fontWeight: "700",
    letterSpacing: -1.5,
    textAlign: "center",
  },
  canvasDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    marginTop: 18,
  },
  canvasIndex: {
    position: "absolute",
    right: 0,
    bottom: 0,
    alignItems: "flex-end",
  },
  canvasIndexNumber: {
    color: "#FFFFFF",
    fontSize: 68,
    lineHeight: 68,
    fontWeight: "700",
    letterSpacing: -3,
  },
  canvasIndexLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "right",
  },
  canvasFooter: { flexDirection: "row", alignItems: "center", gap: 16 },
  canvasFooterText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  canvasRule: { height: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.45)" },
  manifesto: { paddingTop: 104, paddingBottom: 96 },
  manifestoLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.7,
    marginBottom: 18,
  },
  manifestoTitle: {
    fontSize: 42,
    lineHeight: 45,
    fontWeight: "700",
    letterSpacing: -1.5,
    marginBottom: 62,
  },
  manifestoColumns: { flexDirection: "row", gap: 38 },
  manifestoItem: { flex: 1, borderTopWidth: 1, paddingTop: 17 },
  itemNumber: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 30,
  },
  itemTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  itemBody: { fontSize: 14, lineHeight: 22, maxWidth: 290 },
  footer: {
    borderTopWidth: 1,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  footerLink: { fontSize: 12, fontWeight: "700" },
});
