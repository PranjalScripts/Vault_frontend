import React from "react";
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
import { Button, Empty } from "@/components/subjects/SubjectUI";
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
          mobile && { paddingHorizontal: 16, paddingTop: 20 },
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
              style={[styles.title, { color: theme.text }]}
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
export function ProgressBar({
  stats,
  title = "Progress",
}: {
  stats: Summary;
  title?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 10 }}>
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
  const mobile = useWindowDimensions().width < 700;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.panel,
        {
          flexBasis: mobile ? "100%" : "46%",
          flexGrow: 1,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: theme.accentMuted }]}>
          <Feather name="book-open" size={24} color={theme.accent} />
        </View>
        <Feather name="arrow-up-right" size={20} color={theme.textSecondary} />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      {!!description && (
        <Text style={[styles.body, { color: theme.textSecondary }]}>
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
    <Panel>
      <Text
        accessibilityRole="header"
        style={[styles.cardTitle, { color: theme.text }]}
      >
        Continue Revision
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {question
          ? `${question.subject.name} · ${question.topic.name}\nQ${question.questionNumber} — ${question.question}`
          : "Your next revision will appear here when questions are available."}
      </Text>
      <Button
        label={question ? "Continue revision" : "Questions coming soon"}
        disabled={!question}
        onPress={() => {
          if (question)
            router.push({
              pathname: "/interview/question/[id]",
              params: { id: question._id },
            });
        }}
      />
    </Panel>
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
    gap: 24,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  panel: { borderWidth: 1, borderRadius: 20, padding: 22, gap: 16 },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginVertical: 6,
  },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  cardTitle: { fontSize: 20, lineHeight: 28, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600" },
  body: { fontSize: 14, lineHeight: 23 },
  track: { height: 8, borderRadius: 6, overflow: "hidden" },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
