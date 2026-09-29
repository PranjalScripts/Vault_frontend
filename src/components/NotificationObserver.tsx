import API, { forceRefresh } from '@/api/client';
import { safeNotificationRoute } from '@/notifications/routes';
import { useEffect } from "react";
import { AppState } from "react-native";
import { useRouter } from "expo-router";
import { getAuthUser } from "@/api/auth";
import { notificationsAvailable, clearLocalReminders } from "@/notifications/reminders";
import { useNotificationInbox } from "@/notifications/inbox";
import { refreshPushRegistration } from "@/notifications/push";
import { loadNotifications } from "@/notifications/notificationModule";

export default function NotificationObserver({ ready }: { ready: boolean }) {
  const router = useRouter();
  const { refresh: refreshInbox } = useNotificationInbox();
  useEffect(() => {
    if (!ready || !notificationsAvailable) return;
    let active = true;
    let cleanup = () => {};
    const refresh = () => { void refreshPushRegistration().catch(() => console.warn("Phone alert registration will retry when Vault opens.")); };
    void clearLocalReminders().catch(() => console.warn("Could not clear legacy local reminders."));
    const appState = AppState.addEventListener("change", state => { if (state === "active") refresh(); });
    void Promise.resolve().then(loadNotifications).then(async Notifications => {
      const user = await getAuthUser();
      const owner = String(user?.id || user?._id);
      if (!active) return;
      Notifications.setNotificationHandler({ handleNotification: async notification => {
        const own = active && notification.request.content.data.userId === owner;
        return { shouldPlaySound: own, shouldSetBadge: false, shouldShowBanner: own, shouldShowList: own };
      } });
      let handled = "";
      const handle = async (response: import("expo-notifications").NotificationResponse) => {
        if (handled === response.notification.request.identifier) return;
        handled = response.notification.request.identifier;
        const data = response.notification.request.content.data;
        const user = await getAuthUser();
        if (!active) return;
        Notifications.clearLastNotificationResponse();
        if (data.userId !== String(user?.id || user?._id)) return;
        if (data.kind === "inbox") {
          let route = '/notifications';
          try {
            if (typeof data.notificationId === 'string' && /^[a-f\d]{24}$/i.test(data.notificationId)) {
              const result = await forceRefresh(`/notifications/${data.notificationId}`);
              const current = await getAuthUser();
              if (!active || data.userId !== String(current?.id || current?._id)) return;
              route = safeNotificationRoute(result.data.data.route, data.notificationId);
              await API.patch(`/notifications/${data.notificationId}/read`);
            }
          } catch { /* Offline/deleted notification: the inbox remains a safe fallback. */ }
          const current = await getAuthUser();
          if (!active || data.userId !== String(current?.id || current?._id)) return;
          void refreshInbox(); router.push(route as never); return;
        }
        const validId = (id: unknown): id is string => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
        if (data.kind === "task") router.push({ pathname: "/todos", params: validId(data.itemId) ? { itemId: data.itemId } : {} });
        if (data.kind === "study" && validId(data.subjectId) && validId(data.topicId)) {
          router.push({ pathname: "/subjects/[id]", params: { id: data.subjectId, resumeTopicId: data.topicId } });
        }
      };
      refresh();
      const tokenListener = Notifications.addPushTokenListener(() => refresh());
      const received = Notifications.addNotificationReceivedListener(() => { void refreshInbox(); });
      const listener = Notifications.addNotificationResponseReceivedListener(response => { void handle(response); });
      const last = Notifications.getLastNotificationResponse();
      if (last) void handle(last);
      cleanup = () => { tokenListener.remove(); received.remove(); listener.remove(); Notifications.setNotificationHandler(null); };
    }).catch(() => console.warn("Could not initialize mobile notifications."));
    return () => { active = false; cleanup(); appState.remove(); };
  }, [ready, router, refreshInbox]);
  return null;
}
