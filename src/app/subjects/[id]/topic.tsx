import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSubject } from "@/api/api";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Empty, Subject } from "@/components/subjects/SubjectUI";
import { IconButton } from "@/components/subjects/TopicRow";
import { TopicEditor } from "@/components/subjects/TopicEditor";

export default function TopicEditorScreen() {
  const { id, topicId } = useLocalSearchParams<{
    id: string;
    topicId?: string;
  }>();
  const router = useRouter();
  const t = useTheme();
  const dark = useColorScheme() === "dark";
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getSubject(id)
      .then((response) => {
        if (active) setSubject(response.data.data);
      })
      .catch(() => {
        if (active) setError("Unable to load this subject. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/subjects/[id]", params: { id } });
  }, [id, router]);
  const editing = topicId
    ? subject?.topics?.find((topic) => topic._id === topicId)
    : null;
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: dark ? t.background : "#FFFFFF" }}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
          gestureEnabled: !busy,
        }}
      />
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderColor: t.border,
        }}
      >
        <IconButton
          icon="chevron-left"
          label="Back to topics"
          plain
          disabled={busy}
          onPress={goBack}
        />
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
            color: t.text,
          }}
        >
          {topicId ? "Edit Topic" : "Add Topic"}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 32,
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            gap: 24,
          }}
        >
          {loading ? (
            <Empty
              loading
              title="Loading subject"
              description="Getting your topic form ready…"
            />
          ) : error || !subject || (topicId && !editing) ? (
            <Empty
              title="Topic editor unavailable"
              description={
                error || "This subject or topic may have been removed."
              }
              action="Try again"
              onPress={() => setRetry((value) => value + 1)}
            />
          ) : (
            <>
              <View style={{ gap: 6 }}>
                <Text
                  style={{ color: t.accent, fontWeight: "700", fontSize: 14 }}
                >
                  {subject.subjectName}
                </Text>
                <Text
                  style={{
                    color: t.textSecondary,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  Organize what you’re learning and the resources that help.
                </Text>
              </View>
              <TopicEditor
                key={`${id}:${topicId || "new"}`}
                subject={subject}
                editing={editing}
                onBusyChange={setBusy}
                onSaved={goBack}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
