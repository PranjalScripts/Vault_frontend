
import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { googleLogin, saveAuthToken } from "@/api/api";
import { getPuzzleById } from "@/features/puzzles/puzzles";
import { useTheme } from "@/hooks/use-theme";


export default function OnboardingScreen() {
  const router = useRouter();
  const { shareToken, puzzleId } = useLocalSearchParams<{ shareToken?: string; puzzleId?: string }>();
  const returnToPuzzle = typeof puzzleId === "string" && getPuzzleById(puzzleId) ? puzzleId : null;
  const returnToShare = typeof shareToken === "string" && /^[a-f0-9]{64}$/.test(shareToken) ? shareToken : null;
  const theme = useTheme();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");
  const loginInProgress = useRef(false);

  /*
   * -------------------------------------------------------
   * WEB GOOGLE AUTH
   * -------------------------------------------------------
   */
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  /*
   * -------------------------------------------------------
   * ANDROID GOOGLE AUTH CONFIGURATION
   * -------------------------------------------------------
   */
  useEffect(() => {
    if (Platform.OS !== "android") return;

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  const handleBackendLogin = useCallback(async (idToken: string) => {
    try {
      const result = await googleLogin(idToken);

      const token = result.data?.data?.token || result.data?.token;
      const user = result.data?.data?.user || result.data?.user;

      if (!token) {
        throw new Error("Server did not return an authentication token.");
      }

      await saveAuthToken(token, user);

      if (returnToShare) router.replace({ pathname: "/share", params: { token: returnToShare, add: "1" } });
      else if (returnToPuzzle) router.replace({ pathname: "/games/puzzles/[id]", params: { id: returnToPuzzle } });
      else router.replace("/dashboard");
    } catch (error: any) {
      setLoginError(error?.response?.data?.message || error?.message || "Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [router, returnToShare, returnToPuzzle]);

  const handleGoogleLogin = async () => {
    if (loginInProgress.current) return;
    loginInProgress.current = true;
    setLoginError("");
    setIsLoading(true);

    try {
      /*
       * ---------------------------------------------------
       * ANDROID
       * ---------------------------------------------------
       */
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices();

        /*
         * IMPORTANT:
         *
         * Sign out from the previous Google Sign-In session
         * before starting a new login.
         *
         * This does NOT remove the Google account from the
         * phone. It only clears the Google Sign-In session
         * used by this app.
         */
        try {
          await GoogleSignin.signOut();
        } catch (signOutError) {
          /*
           * If there is no existing Google session,
           * signOut() may fail. That's okay.
           */
          console.log("Google sign-out before login:", signOutError);
        }

        /*
         * Start Google Sign-In again.
         *
         * Because the previous app Google session was cleared,
         * Google can show the account chooser.
         */
        const signInResult = await GoogleSignin.signIn();

        const idToken = signInResult.data?.idToken;

        if (!idToken) {
          Alert.alert(
            "Sign-in failed",
            "Google did not return an ID token.",
          );
          setIsLoading(false);
          return;
        }

        await handleBackendLogin(idToken);

        return;
      }

      /*
       * ---------------------------------------------------
       * WEB
       * ---------------------------------------------------
       */
      if (Platform.OS === "web") {
        if (!request) {
          Alert.alert(
            "Sign-in unavailable",
            "Google authentication is not ready yet.",
          );
          setIsLoading(false);
          return;
        }

        /*
         * Ask Google to show the account chooser instead of
         * silently reusing the previous Google account.
         */
        const response = await promptAsync();
        if (response.type === "success") {
          const idToken = response.authentication?.idToken || response.params?.id_token;
          if (!idToken) throw new Error("Google did not return an ID token.");
          await handleBackendLogin(idToken);
        } else if (response.type === "error") {
          throw new Error(response.error?.message || "Google sign-in failed. Please try again.");
        }

        return;
      }
    } catch (error: any) {
      console.log("Google Sign-In Error:", error);

      setIsLoading(false);

      setLoginError(error?.message || "Could not sign in with Google.");
    } finally {
      loginInProgress.current = false;
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.mark,
              {
                backgroundColor: theme.accent,
              },
            ]}
          >
            <View
              style={[
                styles.markInner,
                {
                  backgroundColor: theme.background,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.brand,
              {
                color: theme.text,
              },
            ]}
          >
            vault
          </Text>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          Welcome to Vault.
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Sign in or create your account with Google to open your personal
          library.
        </Text>

        {loginError ? <Text accessibilityRole="alert" style={{ color: theme.text, marginBottom: 16 }}>{loginError}</Text> : null}

        <Pressable
          disabled={isLoading || (Platform.OS === "web" && !request)}
          onPress={handleGoogleLogin}
          style={({ pressed }) => [
            styles.googleButton,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              opacity: pressed || isLoading ? 0.7 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <>
              <View style={styles.googleBadge}>
                <Text style={styles.googleG}>G</Text>
              </View>

              <Text
                style={[
                  styles.googleText,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Text
          style={[
            styles.privacy,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          One secure account for all your subjects.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  content: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    padding: 28,
    borderWidth: 1,
    borderRadius: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 38,
  },

  mark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  markInner: {
    width: 13,
    height: 13,
    borderRadius: 4,
  },

  brand: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -1,
  },

  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -1.6,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 26,
  },

  googleButton: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 5,
  },

  googleBadge: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  googleG: {
    color: "#4285F4",
    fontSize: 20,
    fontWeight: "700",
  },

  googleText: {
    fontSize: 15,
    fontWeight: "700",
  },

  privacy: {
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 14,
  },
});
