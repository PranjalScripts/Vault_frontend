import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Runs in the document head before the app bundle or first body paint.
const restoreTheme = `(() => {
  let preference = 'system';
  try { preference = localStorage.getItem('vault-theme-preference') || 'system'; } catch {}
  const dark = preference === 'dark' || (preference !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.style.backgroundColor = dark ? '#121311' : '#F4F1EA';
  root.style.colorScheme = dark ? 'dark' : 'light';
})();`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background-color: #F4F1EA; }
          @media (prefers-color-scheme: dark) { html, body { background-color: #121311; } }
          body { background-color: inherit; }
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: restoreTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
