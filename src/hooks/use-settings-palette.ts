import { useColorScheme } from '@/hooks/use-color-scheme';

export function useSettingsPalette() {
  const dark = useColorScheme() === 'dark';
  return {
    dark,
    background: dark ? '#061110' : '#F3F7F5',
    card: dark ? '#0D1B19' : '#FFFFFF',
    inset: dark ? '#142421' : '#EDF4F0',
    border: dark ? '#213630' : '#DCE7E2',
    text: dark ? '#F5FAF7' : '#14251F',
    secondary: dark ? '#B2C2CD' : '#536A63',
    accent: dark ? '#46DEAB' : '#15815D',
    danger: dark ? '#FF7983' : '#BA3542',
    mint: dark ? '#113B2E' : '#E0F4EB',
  };
}
