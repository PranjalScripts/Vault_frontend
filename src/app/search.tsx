import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AppLayout } from "@/components/AppLayout";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/subjects/SubjectUI";
import { universalSearch } from "@/api/api";
import { useTheme } from "@/hooks/use-theme";
import { useVault } from "@/contexts/vaultContext";

type Kind = "todo" | "subject" | "topic" | "notes" | "passcode";
type Result = { id: string; kind: Kind; title: string; excerpt: string; subjectId?: string; parentTitle?: string };
type SearchData = { data: Result[]; counts: Record<Kind, number>; pagination: { total: number; totalPages: number; hasNextPage: boolean } };
const labels: Record<Kind, string> = { todo: "Todos", subject: "Subjects", topic: "Topics & resources", notes: "Notes", passcode: "Passcodes" };
export default function UniversalSearchScreen() {
  const params = useLocalSearchParams<{ q?: string; kind?: string; page?: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { isVaultUnlocked } = useVault();
  const [query, setQuery] = useState((params.q || "").slice(0, 200));
  const [kind, setKind] = useState<Kind | "all">(params.kind && Object.hasOwn(labels, params.kind) ? params.kind as Kind : "all");
  const [page, setPage] = useState(Math.max(1, Math.min(10000, parseInt(params.page || "1", 10) || 1)));
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{ key: string; data: SearchData } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const term = query.trim();
  const key = JSON.stringify([term, kind, page, isVaultUnlocked, retry]);
  // Response identity also hides old results immediately when typing or locking the vault.
  const data = response?.key === key ? response.data : null;
  const message = error?.key === key ? error.message : "";
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let active = true;
    setResponse(null);
    setError(null);
    if (term.length < 2 || (kind === "passcode" && !isVaultUnlocked)) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await universalSearch({ q: term, kind, page, includePasscodes: isVaultUnlocked }, controller.signal);
        if (active) setResponse({ key, data: result.data });
      } catch (e: any) {
        if (active && !controller.signal.aborted) setError({ key, message: e.response?.data?.message || "Unable to search. Check your connection and retry." });
      } finally { if (active) setLoading(false); }
    }, 300);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [term, kind, page, isVaultUnlocked, key]));
  const rememberSearch = () => router.setParams({ q: term, kind, page: String(page) });
  const open = (item: Result) => {
    rememberSearch();
    if (item.kind === "subject") router.push({ pathname: "/subjects/[id]", params: { id: item.id } });
    else if (item.kind === "topic") router.push({ pathname: "/subjects/[id]/topic", params: { id: item.subjectId!, topicId: item.id } });
    else if (item.kind === "notes") router.push({ pathname: "/subjects/[id]", params: { id: item.subjectId!, section: "notes" } });
    else if (item.kind === "todo") router.push({ pathname: "/todos", params: { itemId: item.id } });
    else if (isVaultUnlocked) router.push({ pathname: "/passcodes", params: { itemId: item.id } });
  };
  return <AppLayout title="Search everything" mobileTitle="Search" subtitle="Find anything in your workspace.">
    <View style={{ padding: 16, gap: 18, width: "100%", maxWidth: 1000, alignSelf: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.backgroundElement, paddingHorizontal: 14 }}>
        <Feather name="search" size={21} color={theme.textSecondary} />
        <TextInput autoFocus accessibilityLabel="Search everything" placeholder="Subjects, topics, notes, todos…" placeholderTextColor={theme.textSecondary} value={query} maxLength={200} autoCorrect={false} autoCapitalize="none" returnKeyType="search" onChangeText={value => { setQuery(value); setPage(1); }} style={{ flex: 1, minWidth: 0, minHeight: 54, fontSize: 16, color: theme.text }} />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setQuery(""); setPage(1); }} style={{ padding: 10 }}><Feather name="x" size={20} color={theme.textSecondary} /></Pressable>}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(["all", ...Object.keys(labels)] as (Kind | "all")[]).map(value => <Button key={value} secondary={kind !== value} label={`${value === "all" ? "All" : labels[value]}${data && value !== "all" && (value !== "passcode" || isVaultUnlocked) ? ` (${data.counts[value]})` : ""}`} onPress={() => { setKind(value); setPage(1); }} />)}
      </View>
      {!isVaultUnlocked && <View style={{ padding: 14, gap: 10, borderRadius: 12, backgroundColor: theme.accentMuted }}><Text style={{ color: theme.text }}>Passcode platforms are hidden while your vault is locked.</Text><Button label="Open Passcodes to unlock" secondary onPress={() => { rememberSearch(); router.push("/passcodes"); }} /></View>}
      {term.length < 2 ? <Text style={{ color: theme.textSecondary, paddingVertical: 24 }}>Enter at least 2 characters. Search names, descriptions, notes, links and attachment names across your full library.</Text>
        : kind === "passcode" && !isVaultUnlocked ? null
        : loading || (!data && !message) ? <ActivityIndicator accessibilityLabel="Searching" color={theme.accent} />
        : message ? <View style={{ gap: 12 }}><Text accessibilityRole="alert" style={{ color: theme.danger }}>{message}</Text><Button label="Retry search" secondary onPress={() => setRetry(value => value + 1)} /></View>
        : data && <>
          <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary }}>{data.pagination.total} {data.pagination.total === 1 ? "result" : "results"}{!isVaultUnlocked ? " · excluding locked passcodes" : ""}</Text>
          {!data.data.length && <Text style={{ color: theme.text, paddingVertical: 24 }}>No matches. Try another word or choose a different category.</Text>}
          {data.data.map(item => <Pressable key={`${item.kind}:${item.id}`} accessibilityRole="button" accessibilityLabel={`Open ${item.title}, ${labels[item.kind]}`} onPress={() => open(item)} style={({ pressed }) => ({ flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement, borderRadius: 12, opacity: pressed ? 0.7 : 1 })}>
            {item.kind === "subject" || item.kind === "passcode" ? <BrandLogo name={item.title} kind={item.kind === "passcode" ? "platform" : "subject"} size={40} /> : <Feather name={item.kind === "todo" ? "check-square" : item.kind === "notes" ? "file-text" : "book-open"} size={26} color={theme.accent} />}
            <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{labels[item.kind]}{item.parentTitle ? ` · ${item.parentTitle}` : ""}</Text>
              <Text numberOfLines={2} style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>{item.title}</Text>
              {!!item.excerpt && <Text numberOfLines={2} style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>{item.excerpt}</Text>}
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>)}
          {data.pagination.totalPages > 1 && <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}><Button label="Previous" secondary disabled={page === 1} onPress={() => setPage(value => value - 1)} /><Text style={{ color: theme.textSecondary }}>{page} / {data.pagination.totalPages}</Text><Button label="Next" secondary disabled={!data.pagination.hasNextPage} onPress={() => setPage(value => value + 1)} /></View>}
        </>}
    </View>
  </AppLayout>;
}
