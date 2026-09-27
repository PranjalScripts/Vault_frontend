import React, { useCallback } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getInterviewContinue, getInterviewSubject } from "@/api/interview";
import { useTheme } from "@/hooks/use-theme";
import { CatalogCard, ContinueRevision, InterviewPage, Panel, ProgressBar, ResourceState, styles } from "@/features/interview/InterviewUI";
import { QuestionBrowser } from "@/features/interview/QuestionBrowser";
import { useInterviewResource } from "@/features/interview/useInterviewResource";
export default function InterviewSubjectPage() {
  const { subject } = useLocalSearchParams<{ subject: string }>(); const router = useRouter(); const theme = useTheme();
  const loader = useCallback(async () => { const [catalog, next] = await Promise.all([getInterviewSubject(subject), getInterviewContinue(subject)]); return { ...catalog, next }; }, [subject]);
  const { data, loading, error, reload } = useInterviewResource(loader);
  return <InterviewPage title={data?.name || "Subject"} subtitle={data?.description} back={() => router.push("/interview")}>
    {loading || error ? <ResourceState loading={loading} error={error} onRetry={reload} /> : data && <>
      <QuestionBrowser subject={subject} searchOnly />
      <Panel><ProgressBar stats={data} title={`${data.name} Progress`} /></Panel>
      <ContinueRevision question={data.next} />
      <Text accessibilityRole="header" style={[styles.cardTitle, { color: theme.text }]}>Topics</Text>
      <View style={styles.grid}>{data.topics.map(topic => <CatalogCard key={topic._id} title={topic.name} stats={topic} planned={topic.plannedQuestionCount} range={topic.questionNumberStart && topic.questionNumberEnd ? `Q${topic.questionNumberStart}–${topic.questionNumberEnd}` : undefined} onPress={() => router.push({ pathname: "/interview/[subject]/[topic]", params: { subject, topic: topic.slug } })} />)}</View>
    </>}
  </InterviewPage>;
}
