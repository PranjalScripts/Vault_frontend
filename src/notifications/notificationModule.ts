type NotificationsModule = typeof import("expo-notifications");

export function loadNotifications(): NotificationsModule {
  // Metro's lazy import namespace can wrap CommonJS exports in `default`.
  // Load lazily so web and older native builds never initialize this module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded = require("expo-notifications");
  const api = typeof loaded?.getAllScheduledNotificationsAsync === "function"
    ? loaded
    : loaded?.default;
  if (!api || typeof api.getAllScheduledNotificationsAsync !== "function" ||
      typeof api.cancelScheduledNotificationAsync !== "function" ||
      typeof api.scheduleNotificationAsync !== "function") {
    throw new Error("Local notification APIs are unavailable in this app build. Restart Metro and rebuild Vault to enable reminders.");
  }
  return api;
}
