import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { AppLayout } from "@/components/AppLayout";
import { Empty } from "@/components/subjects/SubjectUI";
import { useTheme } from "@/hooks/use-theme";
import type { Question, Summary } from "./types";

export function InterviewPage({
  title,
  subtitle,
  children,
  back,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: () => void;
}) {
  const theme = useTheme();
  const mobile = useWindowDimensions().width < 768;
  return (
    <AppLayout
      mobileTitle="Interview Prep"
      mobileBackAction={back}
      mobileBackLabel="Back to interview prep"
      mobileHeaderActions={<View />}
    >
      <View
        style={[
          styles.page,
          mobile && { paddingHorizontal: 16, paddingTop: 16, gap: 18 },
        ]}
      >
        <View style={styles.row}>
          {back && !mobile && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={back}
              style={styles.back}
            >
              <Feather name="arrow-left" size={23} color={theme.text} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: theme.accent }]}>
              LEARN · REVISE · REPEAT
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.title, mobile && { fontSize: 24, lineHeight: 30 }, { color: theme.text }]}
            >
              {title}
            </Text>
            {!!subtitle && (
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {children}
      </View>
    </AppLayout>
  );
}
/** Measure available content width, including the desktop sidebar's effect. */
export function InterviewGrid({ children, summary = false }: { children: React.ReactNode; summary?: boolean }) {
  const [width, setWidth] = useState(0);
  const gap = 12;
  const minimum = summary ? 310 : 250;
  const columns = Math.max(1, Math.min(summary ? 2 : 3, Math.floor((width + gap) / (minimum + gap))));
  const cardWidth = width ? Math.min(summary ? 520 : 360, (width - gap * (columns - 1)) / columns) : undefined;
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.grid}>
    {React.Children.toArray(children).map((child, index) => <View key={React.isValidElement(child) ? child.key ?? index : index}
      style={{ width: width < 520 ? "100%" : cardWidth, maxWidth: "100%" }}>{child}</View>)}
  </View>;
}

export function ProgressBar({
  stats,
  title = "Progress",
}: {
  stats: Summary;
  title?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {stats.revisedCount} / {stats.questionCount} revised
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: stats.percentage,
          text: `${stats.percentage}% revised`,
        }}
        style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
      >
        <View
          style={{
            height: "100%",
            width: `${stats.percentage}%`,
            backgroundColor: theme.accent,
            borderRadius: 6,
          }}
        />
      </View>
    </View>
  );
}
export function Panel({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  );
}
export function CatalogCard({
  title,
  description,
  stats,
  planned,
  range,
  onPress,
}: {
  title: string;
  description?: string;
  stats: Summary;
  planned: number;
  range?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.panel,
        {
          height: "100%",
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: theme.accentMuted }]}>
          <Feather name="book-open" size={19} color={theme.accent} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text, flex: 1 }]}>{title}</Text>
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      </View>
      {!!description && (
        <Text numberOfLines={2} style={[styles.body, { color: theme.textSecondary }]}>
          {description}
        </Text>
      )}
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {stats.questionCount
          ? `${stats.questionCount} Questions`
          : `${planned} Questions planned`}
        {range ? ` · ${range}` : ""}
      </Text>
      <ProgressBar stats={stats} title={`${stats.percentage}% complete`} />
      {!stats.questionCount && (
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Questions coming soon
        </Text>
      )}
    </Pressable>
  );
}
export function ContinueRevision({ question }: { question: Question | null }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={question ? `Continue revision: ${question.question}` : "Questions coming soon"}
      accessibilityState={{ disabled: !question }} disabled={!question}
      onPress={() => { if (question) router.push({ pathname: "/interview/question/[id]", params: { id: question._id } }); }}
      style={({ pressed }) => [styles.panel, { backgroundColor: theme.accentMuted, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.row}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="play-circle" size={18} color={theme.accent} />
          <Text style={[styles.label, { color: theme.accent }]}>Continue revision</Text>
        </View>
        <Feather name="arrow-right" size={18} color={theme.accent} />
      </View>
      <Text numberOfLines={2} style={[styles.body, { color: theme.text, fontWeight: "600" }]}>
        {question ? `Q${question.questionNumber} · ${question.question}` : "Your next revision will appear here when questions are available."}
      </Text>
      {question && <Text numberOfLines={1} style={[styles.caption, { color: theme.textSecondary }]}>{question.subject.name} · {question.topic.name}</Text>}
    </Pressable>
  );
}
export function ResourceState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  return (
    <Empty
      loading={loading}
      title={
        loading ? "Loading interview prep" : "Unable to load interview prep"
      }
      description={loading ? "Getting your revision workspace ready…" : error}
      action={loading ? undefined : "Try again"}
      onPress={onRetry}
    />
  );
}
export const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    gap: 20,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", gap: 12 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginVertical: 6,
  },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: "700" },
  caption: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: "600" },
  body: { fontSize: 14, lineHeight: 21 },
  track: { height: 5, borderRadius: 6, overflow: "hidden" },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
