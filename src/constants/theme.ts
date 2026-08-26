/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1916',
    background: '#F4F1EA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8E3D8',
    textSecondary: '#6F6A62',
    accent: '#1F4E3D',
    accentMuted: '#DCE8E2',
    border: '#E4DFD4',
    danger: '#C23B22',
    link: '#1A6B4A',
  },
  dark: {
    text: '#F4F1EA',
    background: '#121311',
    backgroundElement: '#1C1E1B',
    backgroundSelected: '#2A2D29',
    textSecondary: '#A8A49C',
    accent: '#7CB89A',
    accentMuted: '#24332C',
    border: '#2E322E',
    danger: '#E0705C',
    link: '#8FCBB0',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
