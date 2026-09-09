import { useThemePreference } from '@/state/theme-preference';
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  const preference = useThemePreference();

  if (hasHydrated) {
    return preference === "system" ? colorScheme : preference;
  }

  return 'light';
}
