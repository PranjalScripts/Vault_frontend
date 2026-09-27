import React, { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getInterviewTopic } from "@/api/interview";
import { InterviewPage, Panel, ProgressBar, ResourceState } from "@/features/interview/InterviewUI";
import { QuestionBrowser } from "@/features/interview/QuestionBrowser";
import { useInterviewResource } from "@/features/interview/useInterviewResource";
export default function InterviewTopicPage() {
  const { subject, topic } = useLocalSearchParams<{ subject: string; topic: string }>(); const router = useRouter();
  const loader = useCallback(() => getInterviewTopic(subject, topic), [subject, topic]);
  const { data, loading, error, reload } = useInterviewResource(loader);
  return <InterviewPage title={data?.name || "Topic"} subtitle={data?.subject.name} back={() => router.push({ pathname: "/interview/[subject]", params: { subject } })}>
    {loading || error ? <ResourceState loading={loading} error={error} onRetry={reload} /> : data && <>
      <Panel><ProgressBar stats={data} title="Topic Progress" /></Panel>
      <QuestionBrowser key={`${subject}/${topic}`} subject={subject} topic={topic} />
    </>}
  </InterviewPage>;
}
