import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import { loadNotifications } from "./notificationModule";
import { readSnapshotValue, writeSnapshotValue } from "./snapshotStore";
import * as SecureStore from "expo-secure-store";
import API from "@/api/client";
import { getAuthUser } from "@/api/auth";
import { planReminders, ReminderPreferences, ReminderSnapshot, ReminderTask } from "./planner";
import type { AxiosResponse } from "axios";

export type { ReminderPreferences } from "./planner";
export const defaultPreferences: ReminderPreferences = { enabled: false, tasks: true, study: true, intervalMinutes: 180 };
export const mobileNotifications = Platform.OS === "ios" || Platform.OS === "android";
export const notificationsAvailable = mobileNotifications && !!requireOptionalNativeModule("ExpoNotificationScheduler");
const CHANNEL = "vault_reminders";
const PREFIX = "vault-local-";
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;
const scheduleListeners = new Set<() => void>();
export function subscribeToReminderSchedule(listener: () => void) {
  scheduleListeners.add(listener);
  return () => { scheduleListeners.delete(listener); };
}
function notifyScheduleChanged() { scheduleListeners.forEach(listener => listener()); }

export async function getReminderScheduleStatus(): Promise<string> {
  if (!notificationsAvailable) return "Reinstall the updated app to enable local reminders.";
  return serial(async () => {
    const id = await userId();
    const preferences = await preferencesFor(id);
    if (!preferences.enabled) return "Enable reminders to schedule notifications on this phone.";
    if (!preferences.tasks && !preferences.study) return "Turn on task or study reminders to get started.";
    if (!(await permission(false))) return "Notifications are blocked. Allow them in your phone settings.";
    const Notifications = loadNotifications();
    if (Platform.OS === "android" && typeof Notifications.getNotificationChannelAsync === "function") {
      const channel = await Notifications.getNotificationChannelAsync(CHANNEL);
      if (channel?.importance === Notifications.AndroidImportance.NONE) return "The reminder channel is blocked. Enable Task and study reminders in phone settings.";
    }
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const upcoming = scheduled.filter(item => item.identifier.startsWith(PREFIX) && item.content.data?.userId === id)
      .map(item => ({ at: Number(item.identifier.split("-").at(-1)), kind: item.content.data?.kind }))
      .filter(item => Number.isFinite(item.at) && item.at > Date.now()).sort((a, b) => a.at - b.at);
    if (upcoming.length) {
      return (["task", "study"] as const).filter(kind => preferences[kind === "task" ? "tasks" : "study"]).map(kind => {
        const next = upcoming.find(item => item.kind === kind);
        if (!next) return kind === "study" ? "Study: open an unfinished subject or topic to start reminders." : "Tasks: add a due date to an incomplete task.";
        const time = new Date(next.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
        return `Next ${kind} reminder: ${time}.`;
      }).join("\n");
    }
    const snapshot = await readSnapshot(id);
    const expected = planReminders(snapshot, preferences, id, Date.now());
    if (expected.length) return "No reminder is queued. Re-select your frequency to try scheduling again.";
    return preferences.tasks && preferences.study
      ? "Nothing scheduled yet. Add a task with a due date or open an unfinished subject or topic."
      : preferences.study
        ? "Nothing scheduled yet. Open an unfinished subject or topic to start the study timer."
        : "Nothing scheduled yet. Add a due date to an incomplete task.";
  });
}

function serial<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
}
async function userId() {
  const user = await getAuthUser();
  const id = user?.id || user?._id;
  if (!id) throw new Error("Sign in before enabling reminders.");
  return String(id);
}
const preferenceKey = (id: string) => `vault-reminders-${id}`;
const snapshotKey = (id: string) => `vault-reminder-data-${id}`;
async function preferencesFor(id: string): Promise<ReminderPreferences> {
  const stored = await SecureStore.getItemAsync(preferenceKey(id));
  if (!stored) return defaultPreferences;
  try {
    const value = JSON.parse(stored);
    return { enabled: value.enabled === true, tasks: value.tasks !== false, study: value.study !== false, intervalMinutes: [1, 120, 180].includes(value.intervalMinutes) ? value.intervalMinutes : value.intervalHours === 2 ? 120 : 180 };
  } catch { return defaultPreferences; }
}
export async function readReminderPreferences() {
  return mobileNotifications ? preferencesFor(await userId()) : defaultPreferences;
}
async function readSnapshot(id: string): Promise<ReminderSnapshot> {
  const stored = await readSnapshotValue(snapshotKey(id));
  if (!stored) return { tasks: [], study: null };
  try {
    const value = JSON.parse(stored);
    return { tasks: Array.isArray(value.tasks) ? value.tasks : [], study: value.study || null };
  } catch { return { tasks: [], study: null }; }
}
async function saveSnapshot(id: string, snapshot: ReminderSnapshot) {
  await writeSnapshotValue(snapshotKey(id), JSON.stringify({
    tasks: snapshot.tasks.map(({ _id, title, dueDate, isCompleted, deletedAt }) => ({ _id, title, dueDate, isCompleted, deletedAt })),
    study: snapshot.study,
  }));
}
async function cancelLocalReminders() {
  if (!notificationsAvailable) return;
  const Notifications = loadNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of scheduled) {
    if (item.identifier.startsWith(PREFIX)) await Notifications.cancelScheduledNotificationAsync(item.identifier);
  }
  notifyScheduleChanged();
}
async function permission(ask: boolean) {
  const Notifications = loadNotifications();
  if (Platform.OS === "android" && !(await Notifications.getNotificationChannelAsync(CHANNEL))) {
    // Only initialize defaults once. Android Settings owns subsequent changes.
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Task and study reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default", enableVibrate: true, vibrationPattern: [0, 250, 150, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      bypassDnd: false,
    });
  }
  let status = await Notifications.getPermissionsAsync();
  if (!status.granted && ask && status.canAskAgain) status = await Notifications.requestPermissionsAsync();
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}
async function reschedule(id: string, snapshot: ReminderSnapshot, preferences: ReminderPreferences) {
  if (!notificationsAvailable) return;
  const Notifications = loadNotifications();
  if (!preferences.enabled) { await cancelLocalReminders(); return; }
  if (!(await permission(false))) { await cancelLocalReminders(); return; }
  const planned = planReminders(snapshot, preferences, id, Date.now()).map(item => ({ ...item, data: { ...item.data, presentation: "vault-native-v1" } }));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const wanted = new Map(planned.map(item => [item.id, item]));
  const unchanged = new Set<string>();
  // Reconcile with the OS queue: remove stale content and preserve identical requests.
  for (const old of scheduled) {
    if (!old.identifier.startsWith(PREFIX)) continue;
    const next = wanted.get(old.identifier);
    if (next && old.content.title === next.title && old.content.body === next.body && JSON.stringify(old.content.data) === JSON.stringify(next.data)) unchanged.add(old.identifier);
    else await Notifications.cancelScheduledNotificationAsync(old.identifier);
  }
  for (const item of planned) {
    if (unchanged.has(item.id)) continue;
    await Notifications.scheduleNotificationAsync({ identifier: item.id,
      content: { title: item.title, body: item.body, data: item.data, sound: "default", autoDismiss: true, sticky: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at), channelId: CHANNEL },
    });
  }
  notifyScheduleChanged();
}
export async function clearLocalReminders() {
  if (!mobileNotifications) return;
  generation++;
  if (!notificationsAvailable) return;
  return serial(async () => {
    await cancelLocalReminders();
    const Notifications = loadNotifications();
    await Notifications.dismissAllNotificationsAsync();
    Notifications.clearLastNotificationResponse();
  });
}
export async function saveReminderPreferences(preferences: ReminderPreferences) {
  if (!mobileNotifications) return;
  if (preferences.enabled && !notificationsAvailable) throw new Error("This installed Vault build does not include local notifications yet. Rebuild and reinstall the app to enable reminders.");
  await serial(async () => {
    const id = await userId();
    if (preferences.enabled && !(await permission(true))) throw new Error("Allow notifications in your phone’s Settings to enable reminders.");
    await reschedule(id, await readSnapshot(id), preferences);
    await SecureStore.setItemAsync(preferenceKey(id), JSON.stringify(preferences));
    notifyScheduleChanged();
  });
  // Also populate an empty/stale snapshot when enabling reminders or changing
  // cadence, rather than relying on an earlier app-start refresh succeeding.
  if (preferences.enabled) await refreshLocalReminders();
}

// Refresh normal app data while online; scheduled notifications themselves never use a server.
export async function refreshLocalReminders() {
  if (!mobileNotifications) return;
  const epoch = generation;
  return serial(async () => {
    if (epoch !== generation) return;
    const id = await userId();
    const snapshot = await readSnapshot(id);
    const preferences = await preferencesFor(id);
    // Refill from persisted data first, including while the phone is offline.
    await reschedule(id, snapshot, preferences);
    const token = await SecureStore.getItemAsync("vault-auth-token");
    if (!token) return;
    try {
      const tasks: ReminderTask[] = [];
      for (let page = 1; ; page++) {
        const config = { params: { page, limit: 50, status: "pending" }, headers: { Authorization: `Bearer ${token}` }, __reminderSync: true, timeout: 10000 };
        const response = await API.get("/todos", config);
        if (epoch !== generation) return;
        tasks.push(...response.data.data);
        if (!response.data.pagination?.hasNextPage) break;
      }
      snapshot.tasks = tasks;
    } catch { /* Keep the last complete local snapshot when offline. */ }
    if (epoch !== generation) return;
    if (snapshot.study) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` }, __reminderSync: true, timeout: 10000 };
        const response = await API.get(`/subjects/${snapshot.study.subjectId}`, config);
        updateStudyFromSubject(snapshot, response.data.data);
      } catch (error) {
        if (error && typeof error === "object" && "response" in error && (error.response as { status?: number })?.status === 404) snapshot.study = null;
      }
    }
    if (epoch !== generation) return;
    await saveSnapshot(id, snapshot);
    await reschedule(id, snapshot, preferences);
  });
}

type SubjectData = { _id: string; subjectName: string; topics: { _id: string; topic: string; status?: string; isCompleted?: boolean }[] };
function updateStudyFromSubject(snapshot: ReminderSnapshot, subject: SubjectData) {
  if (!snapshot.study || snapshot.study.subjectId !== subject?._id) return;
  const topic = subject.topics?.find(item => item._id === snapshot.study?.topicId);
  if (!topic || topic.isCompleted || topic.status === "completed") snapshot.study = null;
  else { snapshot.study.topicTitle = topic.topic; snapshot.study.subjectName = subject.subjectName; }
}
// A subject visit is a study interaction too, including topics without links/files.
// Preserve the last unfinished topic in this subject instead of always choosing the first.
export function recordSubjectStudyVisit(subject: SubjectData) {
  if (!mobileNotifications) return;
  const epoch = generation;
  return serial(async () => {
    if (epoch !== generation) return;
    const id = await userId();
    const snapshot = await readSnapshot(id);
    const unfinished = subject.topics?.filter(topic => !topic.isCompleted && topic.status !== "completed") || [];
    const topic = (snapshot.study?.subjectId === subject._id && unfinished.find(item => item._id === snapshot.study?.topicId))
      || unfinished.find(item => item.status === "in_progress") || unfinished[0];
    if (!topic) return;
    snapshot.study = { subjectId: subject._id, topicId: topic._id, subjectName: subject.subjectName, topicTitle: topic.topic, lastStudiedAt: Date.now() };
    await saveSnapshot(id, snapshot);
    await reschedule(id, snapshot, await preferencesFor(id));
  }).catch(() => console.warn("Could not save the local study reminder."));
}

export function recordStudyActivity(subjectId: string, topicId?: string, subjectName = "your subject", topicTitle = "your topic") {
  if (!mobileNotifications || !topicId) return;
  const epoch = generation;
  void serial(async () => {
    if (epoch !== generation) return;
    const id = await userId();
    const snapshot = await readSnapshot(id);
    snapshot.study = { subjectId, topicId, subjectName, topicTitle, lastStudiedAt: Date.now() };
    await saveSnapshot(id, snapshot);
    await reschedule(id, snapshot, await preferencesFor(id));
  }).catch(() => console.warn("Could not save the local study reminder."));
}

// Called only for successful resource responses; scheduling failures never undo an API edit.
export async function captureReminderData(response: AxiosResponse) {
  if (!mobileNotifications) return;
  const epoch = generation;
  return serial(async () => {
    if (epoch !== generation) return;
    const token = await SecureStore.getItemAsync("vault-auth-token");
    if (!token || response.config.headers?.Authorization !== `Bearer ${token}`) return;
    const id = await userId();
    const snapshot = await readSnapshot(id);
    const url = response.config.url || "";
    const method = response.config.method;
    const data = response.data?.data;
    if (/^\/todos(?:\/[^/]+)?$/.test(url) && url !== "/todos/stats") {
      if (method === "delete") snapshot.tasks = snapshot.tasks.filter(item => item._id !== url.split("/")[2]);
      else {
        const items: ReminderTask[] = Array.isArray(data) ? data : data?._id ? [data] : [];
        const merged = new Map(snapshot.tasks.map(item => [item._id, item]));
        for (const item of items) {
          if (item.isCompleted || item.deletedAt || !item.dueDate) merged.delete(item._id);
          else merged.set(item._id, { _id: item._id, title: item.title, dueDate: item.dueDate });
        }
        snapshot.tasks = [...merged.values()];
      }
    }
    if (url.startsWith("/subjects/")) {
      if (method === "delete" && url === `/subjects/${snapshot.study?.subjectId}`) snapshot.study = null;
      else if (data?._id) updateStudyFromSubject(snapshot, data);
    }
    await saveSnapshot(id, snapshot);
    await reschedule(id, snapshot, await preferencesFor(id));
  });
}
