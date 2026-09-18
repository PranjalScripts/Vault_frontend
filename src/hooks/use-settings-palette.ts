import { useColorScheme } from '@/hooks/use-color-scheme';

export function useSettingsPalette() {
  const dark = useColorScheme() === 'dark';
  return {
    dark,
    background: dark ? '#121815' : '#F7F7F4',
    card: dark ? '#1C2520' : '#FFFFFF',
    inset: dark ? '#232E28' : '#F4F6F5',
    border: dark ? '#344139' : '#E3E8E5',
    text: dark ? '#F6F8F6' : '#0C1013',
    secondary: dark ? '#ADB7B0' : '#70727B',
    accent: dark ? '#8DC7AA' : '#245F4B',
    mint: dark ? '#2B4337' : '#E5F2EC',
  };
}
