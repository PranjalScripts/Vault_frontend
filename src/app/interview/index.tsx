import React, { useCallback } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getInterviewContinue, getInterviewSubjects } from "@/api/interview";
import { Empty } from "@/components/subjects/SubjectUI";
import { useTheme } from "@/hooks/use-theme";
import { CatalogCard, ContinueRevision, InterviewPage, Panel, ProgressBar, ResourceState, styles } from "@/features/interview/InterviewUI";
import { QuestionBrowser } from "@/features/interview/QuestionBrowser";
import { useInterviewResource } from "@/features/interview/useInterviewResource";
export default function InterviewHome() {
  const router = useRouter(); const theme = useTheme();
  const loader = useCallback(async () => { const [catalog, next] = await Promise.all([getInterviewSubjects(), getInterviewContinue()]); return { ...catalog, next }; }, []);
  const { data, loading, error, reload } = useInterviewResource(loader);
  return <InterviewPage title="Interview Prep" subtitle="Build understanding. Revise at your pace.">
    <QuestionBrowser searchOnly />
    {loading || error ? <ResourceState loading={loading} error={error} onRetry={reload} /> : data && <>
      <Panel><ProgressBar stats={data.overall} title="Overall Progress" /></Panel>
      <ContinueRevision question={data.next} />
      <Text accessibilityRole="header" style={[styles.cardTitle, { color: theme.text }]}>Subjects</Text>
      <View style={styles.grid}>{data.data.map(subject => <CatalogCard key={subject._id} title={subject.name} description={subject.description} stats={subject} planned={subject.plannedQuestionCount} onPress={() => router.push({ pathname: "/interview/[subject]", params: { subject: subject.slug } })} />)}</View>
      {!data.data.length && <Empty title="Subjects coming soon" description="Your interview preparation subjects will appear here when available." />}
    </>}
  </InterviewPage>;
}
