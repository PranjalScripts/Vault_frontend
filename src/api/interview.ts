import API from "./client";
import type { AxiosRequestConfig } from "axios";
import type { InterviewSubject, InterviewTopic, Progress, ProgressFilter, Question, QuestionDetail, QuestionPage, Summary } from "@/features/interview/types";
const root = "/interview";
const fresh: AxiosRequestConfig & { cache: boolean } = { cache: false };
export async function getInterviewSubjects(): Promise<{ data: InterviewSubject[]; overall: Summary }> {
  return (await API.get(`${root}/subjects`, fresh)).data;
}
export async function getInterviewSubject(subject: string): Promise<InterviewSubject & { topics: InterviewTopic[] }> {
  return (await API.get(`${root}/subjects/${encodeURIComponent(subject)}`, fresh)).data.data;
}
export async function getInterviewTopic(subject: string, topic: string): Promise<InterviewTopic & { subject: InterviewSubject }> {
  return (await API.get(`${root}/subjects/${encodeURIComponent(subject)}/topics/${encodeURIComponent(topic)}`, fresh)).data.data;
}
export async function getInterviewQuestions(params: { subject?: string; topic?: string; search?: string; tag?: string; status?: ProgressFilter; page?: number }): Promise<QuestionPage> {
  return (await API.get(`${root}/questions`, { params, ...fresh })).data;
}
export async function getInterviewQuestion(id: string): Promise<QuestionDetail> {
  return (await API.get(`${root}/questions/${encodeURIComponent(id)}`, fresh)).data.data;
}
export async function getInterviewContinue(subject?: string, topic?: string): Promise<Question | null> {
  // Fresh across devices and when resuming a previously visited screen.
  return (await API.get(`${root}/continue`, { params: { subject, topic }, ...fresh })).data.data;
}
export async function markInterviewOpened(id: string): Promise<Progress> {
  return (await API.post(`${root}/questions/${encodeURIComponent(id)}/open`)).data.data;
}
export async function updateInterviewProgress(id: string, patch: Partial<Pick<Progress, "revised" | "important">>): Promise<Progress> {
  return (await API.patch(`${root}/questions/${encodeURIComponent(id)}/progress`, patch)).data.data;
}
