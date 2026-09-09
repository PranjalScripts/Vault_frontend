import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { resolveLogo } from "@/utils/logos/resolveLogo";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Subject } from "./SubjectUI";

export function paletteFor(name: string) {
  const logo = resolveLogo(name, "subject");
  return logo
    ? { color: logo.color, tint: `${logo.color.length === 7 ? logo.color : "#64748B"}0D`, border: `${logo.color.length === 7 ? logo.color : "#64748B"}26` }
    : { color: "#64748B", tint: "#F1F5F9", border: "#E2E8F0" };
}
export function SubjectCard({
  subject,
  compact,
  onOpen,
  onMenu,
}: {
  subject: Subject;
  compact: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const t = useTheme();
  const dark = useColorScheme() === "dark";
  const palette = paletteFor(subject.subjectName);
  const tint = dark ? t.backgroundSelected : palette.tint;
  const color = dark ? t.accent : palette.color;
  const topics = [...(subject.topics || [])].sort((a, b) => a.srNo - b.srNo);
  const links = topics.filter((topic) => topic.url?.trim()).length;
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: dark ? t.border : palette.border,
          backgroundColor: compact ? tint : t.backgroundElement,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: tint, padding: compact ? 12 : 16 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${subject.subjectName}`}
          onPress={onOpen}
          style={({ pressed }) => [
            styles.identity,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <BrandLogo name={subject.subjectName} size={compact ? 38 : 42} />
          <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
            <Text numberOfLines={2} style={[styles.name, { color: t.text }]}>
              {subject.subjectName}
            </Text>
            <Text style={[styles.meta, { color: t.textSecondary }]}>
              {topics.length} topics · {links} links
            </Text>
            {compact && (
              <View style={styles.chips}>
                {topics.slice(0, 3).map((topic, index) => (
                  <View
                    key={topic._id || index}
                    style={[
                      styles.chip,
                      { backgroundColor: dark ? t.background : "#E9EDF1" },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: t.textSecondary, fontSize: 10 }}
                    >
                      {topic.topic || `Topic ${topic.srNo}`}
                    </Text>
                  </View>
                ))}
                {topics.length > 3 && (
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: dark ? t.background : "#E9EDF1" },
                    ]}
                  >
                    <Text style={{ color: t.textSecondary, fontSize: 10 }}>
                      +{topics.length - 3}
                    </Text>
                  </View>
                )}
                {!topics.length && (
                  <Text style={[styles.meta, { color: t.textSecondary }]}>
                    Add your first topic
                  </Text>
                )}
              </View>
            )}
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Actions for ${subject.subjectName}`}
          onPress={onMenu}
          style={styles.menu}
        >
          <Feather name="more-vertical" size={18} color={t.textSecondary} />
        </Pressable>
      </View>
      {!compact && (
        <View style={styles.body}>
          <View style={{ gap: 10, flex: 1 }}>
            {topics.slice(0, 5).map((topic, index) => (
              <View key={topic._id || index} style={styles.topic}>
                <View style={[styles.number, { backgroundColor: tint }]}>
                  <Text
                    style={{
                      color: topic.isCompleted ? color : t.textSecondary,
                      fontSize: 12,
                    }}
                  >
                    {topic.isCompleted ? "✓" : topic.srNo}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ color: t.textSecondary, flex: 1, fontSize: 12 }}
                >
                  {topic.topic || `Topic ${topic.srNo}`}
                </Text>
              </View>
            ))}
            {topics.length > 5 && (
              <Text style={{ fontSize: 12, color: t.textSecondary }}>
                + {topics.length - 5} more{" "}
                {topics.length === 6 ? "topic" : "topics"}
              </Text>
            )}
            {!topics.length && (
              <Text
                style={{ fontSize: 13, lineHeight: 21, color: t.textSecondary }}
              >
                A fresh space for your notes, links, and learning resources.
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onOpen}
            style={({ pressed }) => [
              styles.open,
              { backgroundColor: tint, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ color, fontSize: 13, fontWeight: "600" }}>
              Open Subject
            </Text>
            <Feather name="arrow-right" size={16} color={color} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 10, overflow: "hidden", flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  name: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  meta: { fontSize: 11, lineHeight: 16 },
  menu: {
    width: 32,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -7,
    marginTop: -8,
  },
  body: { padding: 14, gap: 16, flex: 1, minHeight: 235 },
  topic: { flexDirection: "row", gap: 10, alignItems: "center" },
  number: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  open: {
    flexDirection: "row",
    gap: 10,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  chips: { flexDirection: "row", gap: 5, flexWrap: "nowrap", marginTop: 2 },
  chip: {
    maxWidth: 80,
    flexShrink: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
});
