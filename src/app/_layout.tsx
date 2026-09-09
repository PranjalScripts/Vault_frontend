import { VaultProvider } from "@/contexts/vaultContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";

import * as ExpoSplashScreen from "expo-splash-screen";

import { StatusBar } from "expo-status-bar";

import { Platform, View } from "react-native";

import { useMemo, useEffect, useState } from "react";

import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { getAuthToken, subscribeToAuthChanges } from "@/api/api";

import { useThemePreferenceReady } from "@/state/theme-preference";
const PROTECTED_ROUTES = ["subjects", "todos", "passcodes", "dashboard", "settings"];

// Hold the single native splash before React mounts. Never replace it with a JS logo.
if (Platform.OS !== "web") {
  ExpoSplashScreen.preventAutoHideAsync().catch(console.warn);
  if (Platform.OS === "ios") ExpoSplashScreen.setOptions({ fade: true, duration: 200 });
}

// =========================================================
// VAULT CONTEXT
// =========================================================

// =========================================================
// ROOT LAYOUT
// =========================================================

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themeReady = useThemePreferenceReady();

  const theme = useTheme();

  const router = useRouter();

  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [rootLaidOut, setRootLaidOut] = useState(false);
  const [startupComplete, setStartupComplete] = useState(Platform.OS === "web");

  const [isReady, setIsReady] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = "Vault";
  }, []);

  useEffect(() => {
    if (!themeReady || typeof document === "undefined") return;
    document.documentElement.style.backgroundColor = theme.background;
    document.documentElement.style.colorScheme = colorScheme === "dark" ? "dark" : "light";
    document.body.style.backgroundColor = theme.background;
  }, [themeReady, colorScheme, theme.background]);

  /*
   * =========================================================
   * INITIAL AUTH CHECK
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const token = await getAuthToken();

        if (!mounted) {
          return;
        }

        console.log("🔐 INITIAL AUTH CHECK");

        console.log("Token exists:", !!token);

        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("❌ Auth initialization failed:", error);

        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * =========================================================
   * LISTEN FOR LOGIN / LOGOUT
   * =========================================================
   */

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authenticated: boolean) => {
      console.log("🔄 AUTH STATE CHANGED:", authenticated);

      setIsAuthenticated(authenticated);
    });

    return unsubscribe;
  }, []);

  /*
   * =========================================================
   * ROUTE PROTECTION
   * =========================================================
   */

  const currentRoute = segments[0];
  const isProtectedRoute = !!currentRoute && PROTECTED_ROUTES.includes(currentRoute);
  const redirectTarget = !isAuthenticated && isProtectedRoute
    ? "/"
    : isAuthenticated && !currentRoute
      ? "/dashboard"
      : null;

  useEffect(() => {
    // The Stack must be mounted before dispatching the existing auth redirects.
    if (isReady && navigationState?.key && redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [isReady, navigationState?.key, redirectTarget, router]);

  useEffect(() => {
    if (startupComplete || !themeReady || !isReady || !rootLaidOut || !navigationState?.key || redirectTarget) return;
    // Give the resolved route a layout/paint turn under the native splash. There is
    // no timer, blank-screen phase, minimum brand delay, or second splash component.
    let cancelled = false;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (cancelled) return;
        ExpoSplashScreen.hideAsync()
          .then(() => { if (!cancelled) setStartupComplete(true); })
          .catch(console.warn);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [startupComplete, themeReady, isReady, rootLaidOut, navigationState?.key, redirectTarget, segments]);

  /*
   * =========================================================
   * NAVIGATION THEME
   * =========================================================
   */

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

  /*
   * =========================================================
   * ROUTER
   * =========================================================
   *
   * IMPORTANT:
   *
   * VaultProvider wraps the entire Stack.
   *
   * Therefore:
   *
   * Stack
   *   └── PasscodesScreen
   *          └── useVault()
   *
   * can access:
   *
   * VaultProvider
   *
   * =========================================================
   */

  // Keep server HTML and the first hydration render empty until storage is read.
  // On native, the existing launch screen stays visible during this step.
  if (!themeReady) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <VaultProvider>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1, backgroundColor: theme.background }} onLayout={() => setRootLaidOut(true)}>
        <Stack
          screenOptions={{
            // Do not animate the initial redirect behind the launch screen.
            animation: startupComplete ? "default" : "none",
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
          {/* =================================================
              LOGIN / ROOT
              ================================================= */}

          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          {/* =================================================
              SUBJECTS
              ================================================= */}

          <Stack.Screen
            name="subjects/index"
            options={{
              animation: "none",
              headerShown: false,
              title: "Subjects",
            }}
          />

          <Stack.Screen
            name="dashboard/index"
            options={{
              headerShown: false,
              title: "Dashboard",
            }}
          />

          <Stack.Screen
            name="subjects/[id]"
            options={{
              headerShown: false,
              title: "Topics",
            }}
          />

          <Stack.Screen
            name="subjects/[id]/topic"
            options={{ headerShown: false }}
          />

          {/* =================================================
              TODOS
              ================================================= */}

          <Stack.Screen
            name="todos/index"
            options={{
              headerShown: false,
              title: "To Do",
            }}
          />

          {/* =================================================
              PASSCODES
              ================================================= */}

          <Stack.Screen
            name="passcodes/index"
            options={{
              headerShown: false,
              title: "Passcodes",
            }}
          />

          {/* =================================================
              OTHER SCREENS
              ================================================= */}

          <Stack.Screen
            name="search"
            options={{ headerShown: false, title: "Search" }}
          />

          <Stack.Screen name="settings" options={{ headerShown: false, title: "Settings" }} />

          <Stack.Screen
            name="trash"
            options={{ headerShown: false, title: "Recently Deleted" }}
          />

          <Stack.Screen
            name="browser"
            options={{
              title: "Browser",
            }}
          />
        </Stack>
        </View>

        <Toast />
      </VaultProvider>
    </ThemeProvider>
  );
}
