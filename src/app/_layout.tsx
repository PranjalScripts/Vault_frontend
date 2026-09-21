import { VaultProvider } from "@/contexts/vaultContext";
import NoDataConnection from "@/components/NoDataConnection";
import NotificationObserver from "@/components/NotificationObserver";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";

import * as WebBrowser from "expo-web-browser";

import * as ExpoSplashScreen from "expo-splash-screen";

import { StatusBar } from "expo-status-bar";

import { Platform, View } from "react-native";

import { useMemo, useEffect, useState } from "react";

import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { getAuthToken, subscribeToAuthChanges } from "@/api/api";

import { useThemePreferenceReady } from "@/state/theme-preference";
const PROTECTED_ROUTES = ["subjects", "todos", "passcodes", "dashboard", "settings", "whatsapp", "search", "games"];

// Google redirects to the origin on web, so completion must run on every route.
// Expo validates the stored redirect URL; AuthSession validates OAuth state.
const completingWebAuth = Platform.OS === "web" && typeof window !== "undefined"
  && /(?:[#?&])state=/.test(window.location.href)
  && /(?:[#?&])(?:id_token|code|error)=/.test(window.location.href)
  && WebBrowser.maybeCompleteAuthSession().type === "success";

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
  const [startupComplete, setStartupComplete] = useState(false);

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
    let authChanged = false;
    const unsubscribe = subscribeToAuthChanges((authenticated: boolean) => {
      authChanged = true;
      setIsAuthenticated(authenticated);
      setIsReady(true);
    });
    getAuthToken().then((token) => {
      if (mounted && !authChanged) {
        setIsAuthenticated(!!token);
        setIsReady(true);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
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
    if (!completingWebAuth && isReady && navigationState?.key && redirectTarget) {
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
        (Platform.OS === "web" ? Promise.resolve() : ExpoSplashScreen.hideAsync())
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
  if (!themeReady || completingWebAuth) return null;

  const routeReady = isReady && !redirectTarget;

  return (
    <ThemeProvider value={navigationTheme}>
      <VaultProvider>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1, backgroundColor: theme.background }} onLayout={() => setRootLaidOut(true)}>
        <View style={{ flex: 1, opacity: routeReady ? 1 : 0 }} pointerEvents={routeReady ? "auto" : "none"}>
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

          <Stack.Screen name="games/index" options={{ headerShown: false, title: "Games" }} />
          <Stack.Screen name="games/tap-clash" options={{ headerShown: false, title: "Tap Clash" }} />
          <Stack.Screen name="games/path" options={{ headerShown: false, title: "Path" }} />
          <Stack.Screen name="games/tic-tac-toe" options={{ headerShown: false, title: "Tic Tac Toe" }} />

          <Stack.Screen
            name="search"
            options={{ headerShown: false, title: "Search" }}
          />

          <Stack.Screen name="whatsapp" options={{ headerShown: false, title: "WhatsApp" }} />

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
        </View>

        <Toast />
        <NotificationObserver ready={isReady && isAuthenticated && startupComplete && !!navigationState?.key && !redirectTarget} />
        <NoDataConnection />
      </VaultProvider>
    </ThemeProvider>
  );
}
