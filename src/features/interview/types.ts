export type Progress = { revised: boolean; important: boolean; revisionCount: number; lastRevisedAt: string | null; lastOpenedAt: string | null };
export type Summary = { questionCount: number; revisedCount: number; importantCount: number; percentage: number };
export type InterviewSubject = Summary & { _id: string; name: string; slug: string; description: string; order: number; plannedQuestionCount: number };
export type InterviewTopic = Summary & { _id: string; subjectId: string; name: string; slug: string; description: string; order: number; plannedQuestionCount: number; questionNumberStart?: number; questionNumberEnd?: number };
export type Question = { _id: string; subjectId: string; topicId: string; questionNumber: number; question: string; tags: string[]; order: number; progress: Progress; subject: InterviewSubject; topic: InterviewTopic };
export type QuestionDetail = Question & { answer: string; example?: string; interviewTip?: string; previous: Pick<Question, "_id" | "questionNumber" | "question"> | null; next: Pick<Question, "_id" | "questionNumber" | "question"> | null };
export type QuestionPage = { data: Question[]; subject: InterviewSubject | null; topic: InterviewTopic | null; pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };
export type ProgressFilter = "all" | "unrevised" | "revised" | "important";
