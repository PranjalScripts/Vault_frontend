import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Empty, Search } from "@/components/subjects/SubjectUI";
import { getInterviewQuestions } from "@/api/interview";
import { useTheme } from "@/hooks/use-theme";
import { useInterviewResource } from "./useInterviewResource";
import { ResourceState, styles } from "./InterviewUI";
import type { ProgressFilter } from "./types";

const filters: { value: ProgressFilter; label: string }[] = [
  { value: "all", label: "All" }, { value: "unrevised", label: "Unrevised" },
  { value: "revised", label: "Revised" }, { value: "important", label: "Important" },
];
export function QuestionBrowser({ subject, topic, searchOnly = false }: { subject?: string; topic?: string; searchOnly?: boolean }) {
  const theme = useTheme(); const router = useRouter();
  const [search, setSearch] = useState(""); const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProgressFilter>("all"); const [page, setPage] = useState(1);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 250); return () => clearTimeout(timer); }, [search]);
  const active = !searchOnly || !!query;
  const loader = useCallback(() => getInterviewQuestions({ subject, topic, search: query, status, page }), [subject, topic, query, status, page]);
  const { data, loading, error, reload } = useInterviewResource(loader, active);
  return <View style={{ gap: 16 }}>
    <Search value={search} onChangeText={setSearch} placeholder="Search interview questions…" />
    {active && <>
      <View style={styles.row}><View style={[styles.row, { justifyContent: "flex-start" }]}>{filters.map(filter => <Pressable key={filter.value} accessibilityRole="button" accessibilityState={{ selected: status === filter.value }} onPress={() => { setStatus(filter.value); setPage(1); }} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 22, backgroundColor: status === filter.value ? theme.accentMuted : theme.backgroundElement, borderWidth: 1, borderColor: status === filter.value ? theme.accent : theme.border }}><Text style={[styles.label, { color: status === filter.value ? theme.accent : theme.textSecondary }]}>{filter.label}</Text></Pressable>)}</View></View>
      {loading || error ? <ResourceState loading={loading} error={error} onRetry={reload} /> : data && <>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{data.pagination.total} {data.pagination.total === 1 ? "question" : "questions"}</Text>
        {!data.data.length && <Empty title={query || status !== "all" ? "No matching questions" : "Questions coming soon"} description={query || status !== "all" ? "Try another search or filter." : "This topic is ready. Questions will appear here once the content is added."} />}
        {data.data.map(question => <Pressable key={question._id} accessibilityRole="button" accessibilityLabel={`Open Q${question.questionNumber}: ${question.question}`} onPress={() => router.push({ pathname: "/interview/question/[id]", params: { id: question._id } })} style={({ pressed }) => [styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}>
          <View style={styles.row}><Text style={[styles.eyebrow, { color: theme.accent }]}>Q{question.questionNumber} · {question.topic.name}</Text><Text style={[styles.body, { color: theme.accent }]}>{question.progress.revised ? "✓ Revised" : "○ Unrevised"}{question.progress.important ? "  ★ Important" : ""}</Text></View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{question.question}</Text>
          {!!question.tags.length && <Text style={[styles.body, { color: theme.textSecondary }]}>{question.tags.join(" · ")}</Text>}
        </Pressable>)}
        {data.pagination.totalPages > 1 && <View style={styles.row}><Button secondary label="Previous page" disabled={!data.pagination.hasPreviousPage} onPress={() => setPage(value => value - 1)} /><Text style={[styles.body, { color: theme.textSecondary }]}>Page {page} of {data.pagination.totalPages}</Text><Button secondary label="Next page" disabled={!data.pagination.hasNextPage} onPress={() => setPage(value => value + 1)} /></View>}
      </>}
    </>}
  </View>;
}
