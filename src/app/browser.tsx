import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";

import { useTheme } from "@/hooks/use-theme";

export default function BrowserScreen() {
  const theme = useTheme();
  const { url, title } = useLocalSearchParams<{
    url: string;
    title?: string;
  }>();

  if (!url) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <Stack.Screen
          options={{
            title: "Browser",
          }}
        />

        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: title || "Browser",
        }}
      />

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {Platform.OS === "web" ? (
          <iframe src={url} style={styles.iframe} title={title || "Browser"} />
        ) : (
          <WebView
            source={{ uri: url }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View
                style={[
                  styles.loadingContainer,
                  { backgroundColor: theme.background },
                ]}
              >
                <ActivityIndicator size="large" color={theme.accent} />
              </View>
            )}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  webview: {
    flex: 1,
  },

  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
  } as any,
});
