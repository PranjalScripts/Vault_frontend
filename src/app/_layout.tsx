import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";

import { StatusBar } from "expo-status-bar";

import {
  useMemo,
  useEffect,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import {
  getAuthToken,
  subscribeToAuthChanges,
} from "@/api/api";

export default function RootLayout() {
  const colorScheme =
    useColorScheme();

  const theme = useTheme();

  const router = useRouter();

  const segments = useSegments();

  const [isReady, setIsReady] =
    useState(false);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  /*
   * =========================================================
   * INITIAL AUTH CHECK
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const token =
          await getAuthToken();

        if (!mounted) {
          return;
        }

        console.log(
          "🔐 INITIAL AUTH CHECK"
        );

        console.log(
          "Token exists:",
          !!token
        );

        setIsAuthenticated(
          !!token
        );
      } catch (error) {
        console.error(
          "❌ Auth initialization failed:",
          error
        );

        if (mounted) {
          setIsAuthenticated(
            false
          );
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
    const unsubscribe =
      subscribeToAuthChanges(
        (authenticated:boolean) => {
          console.log(
            "🔄 AUTH STATE CHANGED:",
            authenticated
          );

          setIsAuthenticated(
            authenticated
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * =========================================================
   * ROUTE PROTECTION
   * =========================================================
   */

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const currentRoute =
      segments[0];

    /*
     * Routes which require login.
     */

    const protectedRoutes = [
      "subjects",
      "todos",
      "passcodes",
      "dashboard",
      "bookmarks",
      "settings",
    ];

    const isProtectedRoute =
      !!currentRoute &&
      protectedRoutes.includes(
        currentRoute
      );

    /*
     * =======================================================
     * CASE 1
     * =======================================================
     *
     * User is NOT authenticated.
     *
     * User tries:
     *
     * /passcodes
     * /todos
     * /subjects
     *
     * Redirect to login.
     */

    if (
      !isAuthenticated &&
      isProtectedRoute
    ) {
      console.log(
        "🚫 Protected route blocked:",
        currentRoute
      );

      router.replace("/");

      return;
    }

    /*
     * =======================================================
     * CASE 2
     * =======================================================
     *
     * User IS authenticated.
     *
     * User opens:
     *
     * /
     *
     * Redirect to Subjects.
     */

    if (
      isAuthenticated &&
      !currentRoute
    ) {
      console.log(
        "✅ User authenticated"
      );

      console.log(
        "➡️ Redirecting to /subjects"
      );

      router.replace(
        "/subjects"
      );
    }
  }, [
    isReady,
    isAuthenticated,
    segments,
    router,
  ]);

  /*
   * =========================================================
   * NAVIGATION THEME
   * =========================================================
   */

  const navigationTheme =
    useMemo(() => {
      const base =
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme;

      return {
        ...base,

        colors: {
          ...base.colors,

          background:
            theme.background,

          card:
            theme.background,

          text:
            theme.text,

          border:
            theme.border,

          primary:
            theme.accent,
        },
      };
    }, [
      colorScheme,
      theme,
    ]);

  /*
   * =========================================================
   * WAIT FOR AUTH CHECK
   * =========================================================
   */

  if (!isReady) {
    return null;
  }

  /*
   * =========================================================
   * ROUTER
   * =========================================================
   */

  return (
    <ThemeProvider
      value={navigationTheme}
    >
      <StatusBar
        style={
          colorScheme === "dark"
            ? "light"
            : "dark"
        }
      />

      <Stack
        screenOptions={{
          headerShadowVisible:
            false,

          headerTintColor:
            theme.text,

          headerTitleStyle: {
            fontWeight: "700",
          },

          headerStyle: {
            backgroundColor:
              theme.background,
          },

          contentStyle: {
            backgroundColor:
              theme.background,
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
            headerShown: false,
            title: "Subjects",
          }}
        />

        <Stack.Screen
          name="subjects/[id]"
          options={{
            title: "Topics",
          }}
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
          name="browser"
          options={{
            title: "Browser",
          }}
        />

        <Stack.Screen
          name="explore"
          options={{
            title: "Explore",
          }}
        />
      </Stack>

      <Toast />
    </ThemeProvider>
  );
}