export type ReminderPreferences = { enabled: boolean; tasks: boolean; study: boolean; intervalMinutes: 1 | 120 | 180 };
export type ReminderTask = { _id: string; title: string; dueDate?: string | null; isCompleted?: boolean; deletedAt?: string | null };
export type StudyActivity = { subjectId: string; topicId: string; subjectName: string; topicTitle: string; lastStudiedAt: number };
export type ReminderSnapshot = { tasks: ReminderTask[]; study: StudyActivity | null };
export type PlannedReminder = { id: string; at: number; title: string; body: string; data: Record<string, string> };

export const MAX_REMINDERS = 60;
const DAY = 86400000;

export function planReminders(snapshot: ReminderSnapshot, preferences: ReminderPreferences, userId: string, now: number): PlannedReminder[] {
  if (!preferences.enabled) return [];
  const interval = preferences.intervalMinutes * 60000;
  const plan: PlannedReminder[] = [];
  const tasks = snapshot.tasks.filter(task => !task.isCompleted && !task.deletedAt && task.dueDate && Number.isFinite(Date.parse(task.dueDate)))
    .sort((a, b) => Date.parse(a.dueDate!) - Date.parse(b.dueDate!) || a._id.localeCompare(b._id));
  if (preferences.tasks && tasks.length) {
    const start = Date.parse(tasks[0].dueDate!);
    // Keep an anchored cadence so opening the app cannot repeatedly postpone reminders.
    const first = start > now ? start : start + Math.ceil((now + 1000 - start) / interval) * interval;
    for (let index = 0; index < MAX_REMINDERS; index++) {
      const at = first + index * interval;
      const due = tasks.filter(task => Date.parse(task.dueDate!) <= at);
      const single = due.length === 1;
      plan.push({ id: `vault-local-task-${userId}-${at}`, at,
        title: single ? "Task due" : `${due.length} tasks are due`,
        body: single ? `“${due[0].title.slice(0, 150)}” is due. Take a moment to finish it.` : `${due.slice(0, 2).map(task => task.title.slice(0, 70)).join(" · ")}${due.length > 2 ? ` and ${due.length - 2} more` : ""}`,
        data: { kind: "task", userId, ...(single ? { itemId: due[0]._id } : {}) },
      });
    }
  }
  const study = snapshot.study;
  const followUps: PlannedReminder[] = [];
  if (preferences.study && study && Number.isFinite(study.lastStudiedAt) && study.lastStudiedAt <= now) {
    const reminder = (at: number): PlannedReminder => {
      const elapsed = at - study.lastStudiedAt;
      const days = Math.floor(elapsed / DAY);
      const hours = Math.floor(elapsed / 3600000);
      const topic = study.topicTitle.slice(0, 100) || "your topic";
      const subject = study.subjectName.slice(0, 100) || "your subject";
      const gap = days ? `${days} ${days === 1 ? "day" : "days"}` : `${hours} ${hours === 1 ? "hour" : "hours"}`;
      return { id: `vault-local-study-${userId}-${at}`, at,
        title: days ? "A little study time today?" : "Continue where you left off",
        body: hours >= 2 ? `It's been ${gap} since your last study activity. Continue ${topic} in ${subject}.` : `Pick up ${topic} in ${subject}. A few minutes is a good start.`,
        data: { kind: "study", userId, subjectId: study.subjectId, topicId: study.topicId },
      };
    };
    // Frequent nudges during the first day; after that, one per day.
    const firstSlot = Math.max(1, Math.floor((now - study.lastStudiedAt) / interval) + 1);
    for (let index = firstSlot; index < firstSlot + MAX_REMINDERS; index++) {
      const at = study.lastStudiedAt + index * interval;
      if (at >= study.lastStudiedAt + DAY) break;
      plan.push(reminder(at));
    }
    // Reserve a few later slots so one-minute task/study queues cannot crowd out
    // inactivity follow-ups. All requests remain native, persisted OS schedules.
    for (const hours of [3, 6, 12]) {
      const at = study.lastStudiedAt + Math.ceil(hours * 3600000 / interval) * interval;
      if (at > now) followUps.push(reminder(at));
    }
    const firstDay = Math.max(1, Math.floor((now - study.lastStudiedAt) / DAY) + 1);
    for (let day = firstDay; day < firstDay + 7; day++) followUps.push(reminder(study.lastStudiedAt + day * DAY));
  }
  const reserved = new Map(followUps.map(item => [item.id, item]));
  const order = (a: PlannedReminder, b: PlannedReminder) => a.at - b.at || a.id.localeCompare(b.id);
  const upcoming = plan.filter(item => !reserved.has(item.id)).sort(order).slice(0, MAX_REMINDERS - reserved.size);
  return [...upcoming, ...reserved.values()].sort(order);
}
