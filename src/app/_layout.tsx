import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  const navigationTheme = useMemo(() => {
    const base = colorScheme === "dark" ? DarkTheme : DefaultTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.background,
        card: theme.background,
        text: theme.text,
        border: theme.border,
        primary: theme.accent,
      },
    };
  }, [colorScheme, theme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: "700",
          },
          headerStyle: {
            backgroundColor: theme.background,
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="subjects/index" options={{ title: "Subjects" }} />
        <Stack.Screen name="subjects/[id]" options={{ title: "Topics" }} />
        <Stack.Screen name="browser" options={{ title: "Browser" }} />
        <Stack.Screen name="explore" options={{ title: "Explore" }} />
      </Stack>
    </ThemeProvider>
  );
}
