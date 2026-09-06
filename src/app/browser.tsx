import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

export default function BrowserScreen() {
  const router = useRouter();
  const theme = useTheme();

  const params = useLocalSearchParams<{
    url?: string;
    title?: string;
  }>();

  /*
   * URL received from Topics page
   */
  const rawUrl = Array.isArray(params.url)
    ? params.url[0]
    : params.url;

  const title = Array.isArray(params.title)
    ? params.title[0]
    : params.title;

  /*
   * Make sure URLs such as:
   *
   * www.google.com
   * google.com
   *
   * become:
   *
   * https://www.google.com
   */
  const webUrl = useMemo(() => {
    if (!rawUrl) {
      return "";
    }

    let cleanUrl = rawUrl.trim();

    if (!cleanUrl) {
      return "";
    }

    if (
      !cleanUrl.startsWith("http://") &&
      !cleanUrl.startsWith("https://")
    ) {
      cleanUrl = `https://${cleanUrl}`;
    }

    return cleanUrl;
  }, [rawUrl]);

  /*
   * =========================================================
   * NO URL
   * =========================================================
   */

  if (!webUrl) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <View style={styles.errorContainer}>
          <Text
            style={[
              styles.errorTitle,
              {
                color: theme.text,
              },
            ]}
          >
            No URL provided
          </Text>

          <Text
            style={[
              styles.errorText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            This topic does not have a valid URL.
          </Text>

          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: theme.accent,
              },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * =========================================================
   * BROWSER
   * =========================================================
   */

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      {/* Hide Expo Router's default header.
          We create our own header so it works
          consistently on Android + Web. */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* =========================
          BROWSER HEADER
          ========================= */}
      <View
        style={[
          styles.browserHeader,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.backIcon,
              {
                color: theme.text,
              },
            ]}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            numberOfLines={1}
            style={[
              styles.browserTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {title || "Browser"}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.browserUrl,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {webUrl}
          </Text>
        </View>
      </View>

      {/* =========================
          WEBVIEW
          ========================= */}

     {Platform.OS === "web" ? (
  <View
    style={[
      styles.webContainer,
      {
        alignItems: "center",
        justifyContent: "center",
      },
    ]}
  >
    <Text
      style={{
        color: theme.text,
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 16,
      }}
    >
      This website cannot be displayed inside the app.
    </Text>

    <TouchableOpacity
      onPress={() => {
        window.open(webUrl, "_blank", "noopener,noreferrer");
      }}
      style={[
        styles.backButton,
        {
          backgroundColor: theme.accent,
        },
      ]}
    >
      <Text style={styles.backButtonText}>
        Open Website
      </Text>
    </TouchableOpacity>
  </View>
) : (
        <WebView
          source={{
            uri: webUrl,
          }}
          style={styles.webView}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          originWhitelist={[
            "http://*",
            "https://*",
          ]}
          renderLoading={() => (
            <View
              style={[
                styles.loadingContainer,
                {
                  backgroundColor: theme.background,
                },
              ]}
            >
              <ActivityIndicator
                size="large"
                color={theme.accent}
              />

              <Text
                style={[
                  styles.loadingText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                Loading website...
              </Text>
            </View>
          )}
          onError={(event) => {
            console.log(
              "❌ WEBVIEW ERROR:",
              event.nativeEvent
            );
          }}
          onHttpError={(event) => {
            console.log(
              "❌ WEBVIEW HTTP ERROR:",
              event.nativeEvent
            );
          }}
          onLoadStart={(event) => {
            console.log(
              "🌐 WEBVIEW LOAD START:",
              event.nativeEvent.url
            );
          }}
          onLoadEnd={(event) => {
            console.log(
              "✅ WEBVIEW LOAD END:",
              event.nativeEvent.url
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /*
   * Browser header
   */

  browserHeader: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },

  backButtonHeader: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 40,
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 4,
    minWidth: 0,
  },

  browserTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  browserUrl: {
    fontSize: 11,
    marginTop: 2,
  },

  /*
   * WebView
   */

  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  webContainer: {
    flex: 1,
    width: "100%",
  },

  /*
   * Loading
   */

  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  /*
   * Error
   */

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },

  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});