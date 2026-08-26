import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Href, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.accent }]}>VAULT</Text>
        <Text style={[styles.title, { color: theme.text }]}>My Vault</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          A quiet place for the subjects and topics you want to keep.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
        activeOpacity={0.85}
        onPress={() => router.push("/subjects" as Href)}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: theme.accentMuted }]}
        >
          <Text style={styles.cardIcon}>📚</Text>
        </View>

        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Subjects
          </Text>
          <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
            Organize topics and open your notes in one tap.
          </Text>
        </View>

        <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 28,
    marginBottom: 36,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.4,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: {
    fontSize: 24,
  },
  cardCopy: {
    flex: 1,
    marginHorizontal: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
});
