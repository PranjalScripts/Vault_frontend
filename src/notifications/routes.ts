export function safeNotificationRoute(route: string, notificationId?: string): string {
  if (route === '/settings?section=security' && notificationId && /^[a-f\d]{24}$/i.test(notificationId)) return `${route}&notificationId=${notificationId}`;
  return /^\/(?:todos|updates|subjects|settings\?section=security(?:&notificationId=[a-f\d]{24})?|interview(?:\/question\/[a-f\d]{24})?|subjects\/[a-f\d]{24}(?:\?resumeTopicId=[a-f\d]{24})?|games(?:\/(?:path|tap-clash|tic-tac-toe))?|puzzles)$/.test(route) ? route : '/notifications';
}
