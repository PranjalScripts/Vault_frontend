export function safeNotificationRoute(route: string): string {
  return /^\/(?:todos|updates|subjects|settings\?section=security|interview(?:\/question\/[a-f\d]{24})?|subjects\/[a-f\d]{24}(?:\?resumeTopicId=[a-f\d]{24})?|games(?:\/(?:path|tap-clash|tic-tac-toe))?|puzzles)$/.test(route) ? route : '/notifications';
}
