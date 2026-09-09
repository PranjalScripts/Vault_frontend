import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import axios, { isAxiosError } from "axios";
import { Button, Empty, Topic } from "@/components/subjects/SubjectUI";
import { useTheme } from "@/hooks/use-theme";

import { getAuthToken, importSharedSubject, subscribeToAuthChanges } from "@/api/api";

type SharedContent = { scope: "subject" | "topic"; subjectName: string; description?: string; notes?: string; topics: Topic[] };

// Also wrap unbroken filenames or URLs pasted into descriptions on web.
const wrapText = Platform.OS === "web" ? { overflowWrap: "anywhere" as const } : {};

function ResourceLink({ label, name, onPress }: { label: string; name?: string; onPress: () => void }) {
  const t = useTheme();
  return <Pressable accessibilityRole="link" accessibilityLabel={name ? `${label}: ${name}` : label}
    onPress={onPress} style={({ pressed }) => [styles.resource, { borderColor: t.border, backgroundColor: t.background, opacity: pressed ? 0.7 : 1 }]}>
    <View style={styles.resourceText}>
      <Text style={[styles.text, { color: t.accent, fontWeight: "700", fontSize: 14 }]}>{label}</Text>
      {!!name && <Text style={[styles.text, { color: t.textSecondary, fontSize: 12, lineHeight: 18 }]}>{name}</Text>}
    </View>
    <Text accessible={false} style={{ color: t.accent, fontSize: 20, flexShrink: 0 }}>↗</Text>
  </Pressable>;
}

export default function SharedSubjectScreen() {
  const { token, add } = useLocalSearchParams<{ token?: string; add?: string }>();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const addingRef = useRef(false);
  const attempted = useRef("");
  const t = useTheme();
  const [content, setContent] = useState<SharedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let changed = false;
    const unsubscribe = subscribeToAuthChanges((signedIn: boolean) => {
      changed = true;
      if (active) setAuthenticated(signedIn);
    });
    void getAuthToken().then(auth => { if (active && !changed) setAuthenticated(!!auth); });
    return () => { active = false; unsubscribe(); };
  }, []);
  const addToSubjects = useCallback(async () => {
    if (!token || !content || addingRef.current) return;
    setAddError("");
    if (!authenticated) {
      router.push({ pathname: "/onboarding", params: { shareToken: token } });
      return;
    }
    addingRef.current = true;
    setAdding(true);
    try {
      const response = await importSharedSubject(token);
      router.replace({ pathname: "/subjects/[id]", params: { id: response.data.data.subjectId } });
    } catch (failure) {
      setAddError(isAxiosError(failure) ? failure.response?.data?.message || "Unable to add this content. Please try again." : "Unable to add this content. Please try again.");
    } finally { addingRef.current = false; setAdding(false); }
  }, [authenticated, content, router, token]);
  useEffect(() => {
    if (add === "1" && authenticated && content && token && attempted.current !== token) {
      attempted.current = token;
      router.setParams({ add: "" });
      void addToSubjects();
    }
  }, [add, authenticated, content, token, router, addToSubjects]);
  useEffect(() => {
    let active = true;
    setContent(null);
    setError("");
    setLoading(true);
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      setError("This share link is invalid or incomplete.");
      setLoading(false);
      return;
    }
    // Public request deliberately bypasses authenticated client defaults and its cache.
    axios.get(`${process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "")}/subjects/shared/${token}`)
      .then((response) => { if (active) setContent(response.data.data); })
      .catch((failure) => {
        if (active) setError(failure.response?.status === 404
          ? "This shared content is no longer available. It may have been deleted."
          : "Unable to load shared content. Please try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, retry]);
  function openResource(url: string) {
    setResourceError("");
    if (!/^https?:\/\//i.test(url)) {
      setResourceError("This resource does not have a supported web address.");
      return;
    }
    void Linking.openURL(url).catch(() => setResourceError("Unable to open this resource."));
  }
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: t.background }]}>
      <Stack.Screen options={{ headerShown: false, title: content?.subjectName || "Shared content" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} horizontal={false}>
        <Text style={{ color: t.accent, fontWeight: "700", fontSize: 18 }}>Vault · Shared with you</Text>
        {loading ? <Empty loading title="Loading shared content" description="Getting your learning resources…" />
          : error ? <Empty title="Shared content unavailable" description={error} action="Try again" onPress={() => setRetry((value) => value + 1)} />
          : content && <>
            <View style={[styles.section, { gap: 12 }]}>
              <Text selectable style={[styles.text, { color: t.text, fontSize: 30, fontWeight: "700" }]}>{content.subjectName}</Text>
              <Text style={{ color: t.textSecondary }}>{content.scope === "topic" ? "Shared topic" : `${content.topics.length} topics`} · Read only</Text>
              {!!content.description && <Text selectable style={[styles.text, { color: t.text, lineHeight: 24 }]}>{content.description}</Text>}
            </View>
            <View style={[styles.section, { gap: 10 }]}>
              <Button label={adding ? "Adding to your subjects…" : authenticated === false ? "Sign in & add" : "Add to my subjects"}
                disabled={adding || authenticated === null} onPress={() => void addToSubjects()} />
              <Text style={[styles.text, { color: t.textSecondary, lineHeight: 20 }]}>
                {content.scope === "topic" ? "Save this topic in a new subject in your library." : "Save your own copy of this subject and all its topics."} Your progress starts fresh. Changes to your copy won’t affect the original.
              </Text>
              {!!addError && <Text accessibilityRole="alert" style={[styles.text, { color: t.danger }]}>{addError}</Text>}
            </View>
            {!!content.notes && <View style={[styles.section, { gap: 10 }]}>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: "700" }}>Notes</Text>
              <Text selectable style={[styles.text, { color: t.text, lineHeight: 24 }]}>{content.notes}</Text>
            </View>}
            {!!resourceError && <Text accessibilityRole="alert" style={{ color: t.danger }}>{resourceError}</Text>}
            {content.topics.map((topic, index) => <View key={index} style={[styles.card, { borderColor: t.border, backgroundColor: t.backgroundElement }]}>
              <Text selectable style={[styles.text, { color: t.text, fontSize: 20, fontWeight: "700" }]}>{topic.srNo}. {topic.topic || `Topic ${topic.srNo}`}</Text>
              <Text style={{ color: t.textSecondary }}>{topic.isCompleted || topic.status === "completed" ? "Completed" : topic.status === "in_progress" ? "In progress" : "Not started"}</Text>
              {!!topic.description && <Text selectable style={[styles.text, { color: t.text, lineHeight: 24 }]}>{topic.description}</Text>}
              {!!topic.url && <ResourceLink label="Open resource" onPress={() => openResource(topic.url!)} />}
              {topic.files?.map((file, fileIndex) => <ResourceLink key={fileIndex} label={file.fileType === "pdf" ? "Open PDF" : "Open resource"} name={file.fileName} onPress={() => openResource(file.fileUrl)} />)}
            </View>)}
            {!content.topics.length && <Text style={{ color: t.textSecondary }}>No topics added yet.</Text>}
          </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%", maxWidth: "100%", minWidth: 0, overflow: "hidden" },
  scroll: { flex: 1, width: "100%", maxWidth: "100%", minWidth: 0 },
  content: { padding: 24, gap: 24, width: "100%", maxWidth: 900, alignSelf: "center" },
  section: { width: "100%", maxWidth: "100%", minWidth: 0 },
  card: { width: "100%", maxWidth: "100%", minWidth: 0, flexShrink: 1, overflow: "hidden", padding: 20, gap: 14, borderWidth: 1, borderRadius: 12 },
  resource: { width: "100%", maxWidth: "100%", minWidth: 0, flexShrink: 1, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 12, padding: 12, minHeight: 48, borderWidth: 1, borderRadius: 8 },
  resourceText: { flex: 1, minWidth: 0, maxWidth: "100%", flexShrink: 1, gap: 4 },
  text: { minWidth: 0, maxWidth: "100%", flexShrink: 1, ...wrapText },
});
