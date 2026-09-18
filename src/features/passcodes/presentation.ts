import type { Passcode } from './types';

export const categories = ['All', 'Social', 'Work', 'Finance', 'Entertainment', 'Other'] as const;
export type Category = typeof categories[number];
// Existing entries have no category field; classify known platforms for display.
export function entryCategory(item: Passcode): Exclude<Category, 'All'> {
  if (item.category && categories.includes(item.category as Category) && item.category !== 'All') return item.category as Exclude<Category, 'All'>;
  const name = item.platform.toLowerCase().trim();
  if (/^(x|twitter|x \(twitter\)|instagram|facebook|reddit|snapchat|tiktok|discord|whatsapp|linkedin)$/.test(name)) return 'Social';
  if (/google|notion|github|gitlab|microsoft|slack|figma|zoom|dropbox/.test(name)) return 'Work';
  if (/stripe|paypal|bank|wise|razorpay|paytm/.test(name)) return 'Finance';
  if (/spotify|netflix|youtube|twitch|steam|prime/.test(name)) return 'Entertainment';
  return 'Other';
}
export const categoryColors: Record<string, string> = { Social: '#68AEFF', Work: '#34E4A1', Finance: '#8775FF', Entertainment: '#FFC653', Other: '#ACC0D9' };
export function entryWebsite(item: Passcode) {
  const website = item.website || (/^https?:\/\//i.test(item.platform) ? item.platform : null);
  if (!website) return null;
  try { const url = new URL(website); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function entryDate(value?: string) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Not available';
  return new Date(value).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
