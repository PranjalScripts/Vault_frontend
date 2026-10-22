import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getInterviewQuestion, getInterviewQuestions, markInterviewOpened, resetInterviewMcqAnswer, submitInterviewMcqAnswer, updateInterviewProgress } from "@/api/interview";
import { Button } from "@/components/subjects/SubjectUI";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { useTheme } from "@/hooks/use-theme";
import { InterviewPage, Panel, ResourceState, styles } from "@/features/interview/InterviewUI";
import { useInterviewResource } from "@/features/interview/useInterviewResource";
import type { Progress, Question } from "@/features/interview/types";
import { InterviewContent } from "@/features/interview/InterviewContent";
export default function InterviewQuestionPage() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const theme = useTheme();
  const mobile = useWindowDimensions().width < 700;
  const { showSuccess, showError } = useFeedbackModal();
  const loader = useCallback(() => getInterviewQuestion(id), [id]);
  const { data, setData, loading, error, reload } = useInterviewResource(loader);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [suggested, setSuggested] = useState<Question[]>([]);
  const [positionError, setPositionError] = useState(false); const opened = useRef("");
  useFocusEffect(useCallback(() => { opened.current = ""; }, []));
  const savePosition = useCallback(async (questionId: string) => {
    try { await markInterviewOpened(questionId); setPositionError(false); }
    catch { setPositionError(true); }
  }, []);
  useEffect(() => {
    if (!loading && !error && data?._id === id && opened.current !== id) { opened.current = id; setPositionError(false); void savePosition(id); }
  }, [data?._id, id, loading, error, savePosition]);
  const save = async (patch: Partial<Pick<Progress, "revised" | "important">>) => {
    if (busyRef.current || !data) return;
    busyRef.current = true; setBusy(true);
    try {
      const progress = await updateInterviewProgress(data._id, patch);
      setData(current => current?._id === data._id ? { ...current, progress } : current);
      showSuccess({ title: patch.revised !== undefined ? (patch.revised ? "Question Revised" : "Marked Unrevised") : (patch.important ? "Marked Important" : "Removed from Important"), message: "Your revision progress has been saved." });
    } catch { showError({ title: "Unable to Save Progress", message: "Your progress could not be saved. Please try again." }); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const answer = async (optionId: string | null) => {
    if (busyRef.current || !data) return;
    busyRef.current = true; setBusy(true);
    try {
      const progress = optionId === null
        ? await resetInterviewMcqAnswer(data._id)
        : await submitInterviewMcqAnswer(data._id, optionId);
      setData(current => current?._id === data._id ? { ...current, progress } : current);
    } catch {
      showError({ title: optionId === null ? "Unable to Reset Response" : "Unable to Evaluate Answer", message: "Your MCQ response could not be saved. Please try again." });
    } finally {
      busyRef.current = false; setBusy(false);
    }
  };
  const back = () => data ? router.push({ pathname: "/interview/[subject]/[topic]", params: { subject: data.subject.slug, topic: data.topic.slug } }) : router.push("/interview");
  const suggestionSubject = data?.subject.slug;
  const suggestionTopic = data?.topic.slug;
  const suggestionNumber = data?.questionNumber;
  const questionId = data?._id;
  useEffect(() => {
    if (!questionId || !suggestionSubject || !suggestionTopic || suggestionNumber === undefined || mobile) { setSuggested([]); return; }
    let active = true;
    void getInterviewQuestions({ subject: suggestionSubject, topic: suggestionTopic, page: 1 })
      .then(page => { if (active) setSuggested(page.data.filter(question => question.questionNumber > suggestionNumber).slice(0, 8)); })
      .catch(() => { if (active) setSuggested([]); });
    return () => { active = false; };
  }, [questionId, suggestionSubject, suggestionTopic, suggestionNumber, mobile]);
  return <InterviewPage title={data ? `Q${data.questionNumber}` : "Question"} back={back}>
    {loading || error ? <ResourceState loading={loading} error={error} onRetry={reload} /> : data && <>
      <View style={[styles.row, { justifyContent: "flex-start" }]}><Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/interview/[subject]", params: { subject: data.subject.slug } })} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[styles.label, { color: theme.accent }]}>{data.subject.name}</Text></Pressable><Text style={{ color: theme.textSecondary }}>›</Text><Pressable accessibilityRole="link" onPress={back} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[styles.label, { color: theme.accent }]}>{data.topic.name}</Text></Pressable></View>
      <View style={{ flexDirection: !mobile ? "row" : "column", alignItems: "flex-start", gap: 20 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 16 }}>
          <Text accessibilityRole="header" selectable style={[styles.cardTitle, { fontSize: 26, lineHeight: 36, color: theme.text }]}>{data.question}</Text>
          {data.options?.length ? <Panel>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{data.progress.answered ? `Solved · ${data.progress.isCorrect ? "Correct" : "Incorrect"}` : "Unsolved"}</Text>
            <Text style={[styles.eyebrow, { color: theme.accent }]}>CHOOSE AN ANSWER</Text>
            <View style={{ gap: 8 }}>
              {data.options.map(option => {
                const selected = data.progress.selectedOptionId === option.id;
                const correct = data.progress.answered && option.id === data.correctOptionId;
                const wrong = selected && option.id !== data.correctOptionId;
                return <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: busy || data.progress.answered }}
                  disabled={busy || data.progress.answered}
                  onPress={() => void answer(option.id)}
                  style={({ pressed }) => ({
                    minHeight: 52, padding: 14, borderRadius: 10, borderWidth: 1,
                    borderColor: correct ? theme.link : wrong ? theme.danger : theme.border,
                    backgroundColor: correct ? theme.accentMuted : pressed ? theme.backgroundSelected : theme.backgroundElement,
                  })}
                >
                  <Text style={[styles.body, { color: correct ? theme.link : wrong ? theme.danger : theme.text }]}>{option.id.toUpperCase()}. {option.text}</Text>
                </Pressable>;
              })}
            </View>
            {data.progress.answered && <>
              <Text accessibilityRole="header" style={[styles.label, { color: data.progress.isCorrect ? theme.link : theme.danger }]}>
                {data.progress.isCorrect ? "Correct" : `Not quite. Correct answer: ${data.options.find(option => option.id === data.correctOptionId)?.text ?? ""}`}
              </Text>
              {!!data.explanation && <InterviewContent content={data.explanation} />}
              <Button secondary label={busy ? "Resetting…" : "Reset response"} disabled={busy} onPress={() => void answer(null)} />
            </>}
          </Panel> : <Panel><Text style={[styles.eyebrow, { color: theme.accent }]}>ANSWER</Text><InterviewContent content={data.answer} /></Panel>}
          {!!data.example && <Panel><Text style={[styles.eyebrow, { color: theme.accent }]}>EXAMPLE</Text><InterviewContent content={data.example} code /></Panel>}
          {!!data.interviewTip && <Panel><Text style={[styles.eyebrow, { color: theme.accent }]}>INTERVIEW TIP</Text><InterviewContent content={data.interviewTip} /></Panel>}
          <Button secondary label={data.progress.important ? "★ Important" : "☆ Mark Important"} disabled={busy} onPress={() => void save({ important: !data.progress.important })} />
          {mobile && <Button label={busy ? "Saving…" : data.progress.revised ? "✓ Revised · Mark Unrevised" : "Mark Revised"} disabled={busy} onPress={() => void save({ revised: !data.progress.revised })} />}
          <View style={styles.row}><Button secondary label="Previous" disabled={busy || !data.previous} onPress={() => { if (data.previous) router.replace({ pathname: "/interview/question/[id]", params: { id: data.previous._id } }); }} />{!mobile && <Button label={busy ? "Saving…" : data.progress.revised ? "✓ Revised · Mark Unrevised" : "Mark Revised"} disabled={busy} onPress={() => void save({ revised: !data.progress.revised })} />}<Button secondary label="Next" disabled={busy || !data.next} onPress={() => { if (data.next) router.replace({ pathname: "/interview/question/[id]", params: { id: data.next._id } }); }} /></View>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{data.progress.revisionCount} {data.progress.revisionCount === 1 ? "revision" : "revisions"}{data.progress.lastRevisedAt ? ` · Last revised ${new Date(data.progress.lastRevisedAt).toLocaleDateString()}` : ""}</Text>
          {positionError && <Panel><Text style={[styles.body, { color: theme.textSecondary }]}>Your reading position could not be saved.</Text><Button secondary label="Retry saving position" onPress={() => void savePosition(id)} /></Panel>}
        </View>
        {!mobile && <View style={{ width: 320, maxWidth: "36%", gap: 10, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.backgroundElement }}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>CONTINUE LEARNING</Text>
          <Text style={[styles.cardTitle, { color: theme.text, fontSize: 18 }]}>Next suggested questions</Text>
          {suggested.length ? <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ gap: 8 }}>
            {suggested.map(question => <Pressable key={question._id} accessibilityRole="button" accessibilityLabel={`Open Q${question.questionNumber}: ${question.question}`} onPress={() => router.push({ pathname: "/interview/question/[id]", params: { id: question._id } })} style={({ pressed }) => ({ padding: 12, borderRadius: 10, backgroundColor: pressed ? theme.backgroundSelected : theme.background, borderWidth: 1, borderColor: theme.border, gap: 5 })}>
                <Text style={[styles.label, { color: theme.accent }]}>Q{question.questionNumber}</Text>
                <Text style={[styles.body, { color: theme.text }]}>{question.question}</Text>
              </Pressable>)}
          </ScrollView> : <Text style={[styles.body, { color: theme.textSecondary }]}>No more questions in this topic.</Text>}
        </View>}
      </View>
    </>}
  </InterviewPage>;
}
