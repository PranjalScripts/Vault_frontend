/** Migration helpers for the retired phone-only reminder scheduler. */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { loadNotifications } from './notificationModule';
import { recordReminderActivity } from './activity';

export const mobileNotifications = Platform.OS === 'ios' || Platform.OS === 'android';
export const notificationsAvailable = mobileNotifications && !!requireOptionalNativeModule('ExpoNotificationScheduler');
const PREFIX = 'vault-local-';
let cleanup: Promise<void> | null = null;
export async function clearLocalReminders() {
  if (!notificationsAvailable) return;
  if (cleanup) return cleanup;
  cleanup = (async () => {
    const notifications = loadNotifications();
    const scheduled = await notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.filter(item => item.identifier.startsWith(PREFIX)).map(item => notifications.cancelScheduledNotificationAsync(item.identifier)));
    const presented = await notifications.getPresentedNotificationsAsync();
    await Promise.all(presented.filter(item => item.request.identifier.startsWith(PREFIX)).map(item => notifications.dismissNotificationAsync(item.request.identifier)));
    // Keep a remote notification tap available for cold-start navigation.
    const response = notifications.getLastNotificationResponse();
    if (response?.notification.request.identifier.startsWith(PREFIX)) notifications.clearLastNotificationResponse();
  })().finally(() => { cleanup = null; });
  return cleanup;
}

type SubjectData = { _id: string };
export function recordSubjectStudyVisit(subject: SubjectData) {
  void recordReminderActivity({ kind: 'study', subjectId: subject._id });
}
export function recordStudyActivity(subjectId: string, topicId?: string, _subjectName = '', _topicTitle = '') {
  void recordReminderActivity({ kind: 'study', subjectId, topicId });
}
