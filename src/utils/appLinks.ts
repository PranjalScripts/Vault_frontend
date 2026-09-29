/** Keep only public share routes and their content identifiers in app links. */
export function appLinkTarget(href: string): string | null {
  const url = new URL(href);
  if (/^\/share\/?$/.test(url.pathname)) {
    const token = url.searchParams.get('token');
    return token && /^[a-f0-9]{64}$/.test(token) ? `/share?token=${token}` : null;
  }
  if (/^\/(?:games\/)?puzzles\/[^/]+\/?$/.test(url.pathname)) {
    return url.pathname;
  }
  return null;
}

export function androidAppIntent(href: string): string | null {
  const target = appLinkTarget(href);
  if (!target) return null;
  const fallback = new URL(href);
  fallback.searchParams.set('browser', '1');
  return `intent://${target.slice(1)}#Intent;scheme=vault;package=com.pranjal.vault;S.browser_fallback_url=${encodeURIComponent(fallback.toString())};end`;
}
