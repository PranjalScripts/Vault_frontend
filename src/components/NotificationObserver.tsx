import { useEffect } from "react";
import { AppState } from "react-native";
import { useRouter } from "expo-router";
import { getAuthUser } from "@/api/auth";
import { notificationsAvailable, refreshLocalReminders } from "@/notifications/reminders";
import { loadNotifications } from "@/notifications/notificationModule";

export default function NotificationObserver({ ready }: { ready: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!ready || !notificationsAvailable) return;
    let active = true;
    let cleanup = () => {};
    const refresh = () => { void refreshLocalReminders().catch(() => console.warn("Local reminders will refresh when Vault becomes active.")); };
    refresh();
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
        const validId = (id: unknown): id is string => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
        if (data.kind === "task") router.push({ pathname: "/todos", params: validId(data.itemId) ? { itemId: data.itemId } : {} });
        if (data.kind === "study" && validId(data.subjectId) && validId(data.topicId)) {
          router.push({ pathname: "/subjects/[id]", params: { id: data.subjectId, resumeTopicId: data.topicId } });
        }
      };
      const listener = Notifications.addNotificationResponseReceivedListener(response => { void handle(response); });
      const last = Notifications.getLastNotificationResponse();
      if (last) void handle(last);
      cleanup = () => { listener.remove(); Notifications.setNotificationHandler(null); };
    }).catch(() => console.warn("Could not initialize mobile notifications."));
    return () => { active = false; cleanup(); appState.remove(); };
  }, [ready, router]);
  return null;
}
