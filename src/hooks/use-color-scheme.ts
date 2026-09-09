import { useColorScheme as useSystemColorScheme } from "react-native";
import { useThemePreference } from "@/state/theme-preference";

export function useColorScheme() {
  const system = useSystemColorScheme();
  const preference = useThemePreference();
  return preference === "system" ? system : preference;
}
