import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AppLayout } from "@/components/AppLayout";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/subjects/SubjectUI";
import { universalSearch } from "@/api/api";
import { useTheme } from "@/hooks/use-theme";
import { useVault } from "@/contexts/vaultContext";

import { topicResources, primaryResource, type SearchResource } from "@/utils/searchResources";

type Kind = "todo" | "subject" | "topic" | "notes" | "passcode" | "puzzle" | "interview";
type Result = { id: string; kind: Kind; title: string; excerpt: string; route?: string; subjectId?: string; parentTitle?: string; url?: string; files?: { fileName: string; fileUrl: string }[] };
type SearchData = { data: Result[]; counts: Record<Kind, number>; pagination: { total: number; totalPages: number; hasNextPage: boolean } };
const icons: Record<Kind, React.ComponentProps<typeof Feather>["name"]> = { todo: "check-square", subject: "book", topic: "book-open", notes: "file-text", puzzle: "help-circle", passcode: "lock", interview: "briefcase" };
const descriptions: Record<Kind, string> = { subject: "Courses and collections", topic: "Topics, links and attachments", notes: "Ideas and saved notes", todo: "Tasks and descriptions", puzzle: "Questions, categories and difficulty", passcode: "Platforms in your vault", interview: "Questions, answers, tags, subjects and topics" };
const kinds: Kind[] = ["subject", "topic", "notes", "todo", "passcode", "puzzle", "interview"];
const labels: Record<Kind, string> = { todo: "Todos", subject: "Subjects", topic: "Topics & resources", notes: "Notes", puzzle: "Puzzles", passcode: "Passcodes", interview: "Interview Prep" };
export default function UniversalSearchScreen() {
  const params = useLocalSearchParams<{ q?: string; kind?: string; page?: string }>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const input = useRef<TextInput>(null);
  const results = useRef<FlatList<Result>>(null);
  const [resourceError, setResourceError] = useState("");
  const [focused, setFocused] = useState(false);
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
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== "web") return;
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); input.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []));
  const chooseKind = (value: Kind | "all") => { setKind(value); setPage(1); results.current?.scrollToOffset({ offset: 0, animated: false }); };
  const rememberSearch = () => router.setParams({ q: term, kind, page: String(page) });
  const openResource = async (resource: SearchResource) => {
    rememberSearch();
    setResourceError("");
    try {
      if (Platform.OS === "web") window.open(resource.url, "_blank", "noopener,noreferrer");
      else if (resource.isFile) await Linking.openURL(resource.url);
      else router.push({ pathname: "/browser", params: { url: resource.url, title: resource.label } });
    } catch { setResourceError("Unable to open this resource. Please try again."); }
  };
  const open = (item: Result) => {
    rememberSearch();
    if (item.kind === "subject") router.push({ pathname: "/subjects/[id]", params: { id: item.id } });
    else if (item.kind === "topic") {
      const resource = primaryResource(topicResources(item), term);
      if (resource) void openResource(resource);
      else setResourceError("This topic has no available URL or file to open.");
    }
    else if (item.kind === "notes") router.push({ pathname: "/subjects/[id]", params: { id: item.subjectId!, section: "notes" } });
    else if (item.kind === "todo") router.push({ pathname: "/todos", params: { itemId: item.id } });
    else if (item.kind === "puzzle") router.push({ pathname: "/puzzles/[id]", params: { id: item.id } });
    else if (item.kind === "interview" && item.route?.startsWith("/interview/")) router.push(item.route as never);
    else if (isVaultUnlocked) router.push({ pathname: "/passcodes", params: { itemId: item.id } });
  };
  const locked = kind === "passcode" && !isVaultUnlocked;
  const searching = term.length >= 2 && !locked && (loading || (!data && !message));
  const total = data?.pagination.total || 0;
  const unlock = () => { rememberSearch(); router.push("/passcodes"); };

  const emptyState = locked ? (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accentMuted }]}><Feather name="lock" size={28} color={theme.accent} /></View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>Unlock to search your vault</Text>
      <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>Search saved platform names after unlocking your vault. Your passwords never appear in search results.</Text>
      <Button label="Unlock vault" onPress={unlock} />
    </View>
  ) : term.length < 2 ? (
    <View style={styles.start}>
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{kind === "all" ? "EXPLORE YOUR WORKSPACE" : `SEARCH IN ${labels[kind].toUpperCase()}`}</Text>
      <Text style={[styles.startTitle, { color: theme.text }]}>{term ? "Keep typing…" : "What are you looking for?"}</Text>
      <Text style={[styles.emptyCopy, { color: theme.textSecondary, textAlign: "left" }]}>Search with at least two characters. Find a task, revisit your notes, or pick up where you left off.</Text>
      <View style={styles.scopeGrid}>
        {(kind === "all" ? kinds : [kind]).map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Search ${labels[value]}`} onPress={() => { chooseKind(value); if (value !== "passcode" || isVaultUnlocked) input.current?.focus(); }}
          style={({ pressed }) => [styles.scope, { width: isPhone ? "100%" : "48%", borderColor: theme.border, backgroundColor: pressed ? theme.accentMuted : theme.backgroundElement }]}>
          <View style={[styles.scopeIcon, { backgroundColor: theme.accentMuted }]}><Feather name={icons[value]} size={20} color={theme.accent} /></View>
          <View style={styles.copy}><Text style={[styles.scopeTitle, { color: theme.text }]}>{labels[value]}</Text><Text style={[styles.small, { color: theme.textSecondary }]}>{value === "passcode" && !isVaultUnlocked ? "Unlock your vault to search" : descriptions[value]}</Text></View>
          <Feather name={value === "passcode" && !isVaultUnlocked ? "lock" : "arrow-up-right"} size={17} color={theme.textSecondary} />
        </Pressable>)}
      </View>
    </View>
  ) : searching ? (
    <View style={styles.empty}><ActivityIndicator size="large" accessibilityLabel="Searching your workspace" color={theme.accent} /><Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>Searching your workspace…</Text></View>
  ) : message ? (
    <View style={styles.empty}><Feather name="wifi-off" size={30} color={theme.textSecondary} /><Text style={[styles.emptyTitle, { color: theme.text }]}>Search couldn’t load</Text><Text accessibilityRole="alert" style={[styles.emptyCopy, { color: theme.danger }]}>{message}</Text><Button label="Try again" onPress={() => setRetry(value => value + 1)} /></View>
  ) : (
    <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSelected }]}><Feather name="search" size={28} color={theme.textSecondary} /></View><Text style={[styles.emptyTitle, { color: theme.text }]}>No matches found</Text><Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>Try a shorter phrase, check the spelling, or search across all your workspace.</Text>{kind !== "all" && <Button label="Search all categories" secondary onPress={() => chooseKind("all")} />}</View>
  );

  return <AppLayout  showMobileSearch={false} scrollable={false}>
    <View style={styles.screen}>
      <View style={[styles.searchBox, { borderColor: focused ? theme.accent : theme.border, backgroundColor: theme.backgroundElement }]}>
        <Feather name="search" size={24} color={focused ? theme.accent : theme.textSecondary} />
        <TextInput ref={input} autoFocus={!isPhone} accessibilityLabel="Search your workspace" placeholder={isPhone ? "Search your workspace…" : "Search tasks, notes, interview prep and more…"} placeholderTextColor={theme.textSecondary} value={query} maxLength={200} autoCorrect={false} autoCapitalize="none" returnKeyType="search"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onChangeText={value => { setQuery(value); setPage(1); setResourceError(""); }} onSubmitEditing={rememberSearch}
          style={[styles.searchInput, { color: theme.text, fontSize: isPhone ? 16 : 18 }]} />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setQuery(""); setPage(1); input.current?.focus(); }} style={styles.clear}><Feather name="x" size={19} color={theme.textSecondary} /></Pressable>}
        {!isPhone && !query && <View style={[styles.keyHint, { borderColor: theme.border }]}><Text style={[styles.small, { color: theme.textSecondary }]}>Ctrl / ⌘ K</Text></View>}
      </View>
      <View style={[styles.tabsWrap, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.tabs}>
          {(["all", ...kinds] as (Kind | "all")[]).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: kind === value }} accessibilityLabel={value === "all" ? "All results" : labels[value]} onPress={() => chooseKind(value)}
            style={[styles.tab, { borderBottomColor: kind === value ? theme.accent : "transparent" }]}>
            <Feather name={value === "all" ? "grid" : icons[value]} size={16} color={kind === value ? theme.accent : theme.textSecondary} />
            <Text style={[styles.tabText, { color: kind === value ? theme.accent : theme.textSecondary }]}>{value === "all" ? "All results" : labels[value]}</Text>
            {value === "passcode" && !isVaultUnlocked ? <Feather name="lock" size={12} color={theme.textSecondary} /> : data && <Text style={[styles.count, { color: theme.textSecondary, backgroundColor: theme.backgroundSelected }]}>{value === "all" ? Object.values(data.counts).reduce((sum, count) => sum + count, 0) : data.counts[value]}</Text>}
          </Pressable>)}
        </ScrollView>
      </View>
      {!!resourceError && <Text accessibilityRole="alert" style={{ color: theme.danger, fontSize: 13, paddingVertical: 12 }}>{resourceError}</Text>}
      <FlatList ref={results} style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        data={term.length >= 2 && !locked && !searching && !message ? data?.data || [] : []} keyExtractor={item => `${item.kind}:${item.id}`}
        ListHeaderComponent={term.length >= 2 && !locked && !searching && !message && data ? <View style={styles.resultHeading}><Text accessibilityLiveRegion="polite" style={[styles.small, { color: theme.textSecondary }]}>{total} {total === 1 ? "result" : "results"} for “{term}”</Text><Text style={[styles.small, { color: theme.textSecondary }]}>Best matches first</Text></View> : null}
        ListEmptyComponent={emptyState}
        renderItem={({ item }) => <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}><Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}, ${labels[item.kind]}`} onPress={() => open(item)}
          style={({ pressed }) => [styles.result, { borderBottomColor: theme.border, backgroundColor: pressed ? theme.accentMuted : "transparent" }]}>
          <View style={[styles.resultIcon, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {item.kind === "subject" || item.kind === "passcode" ? <BrandLogo name={item.title} kind={item.kind === "passcode" ? "platform" : "subject"} size={32} /> : <Feather name={icons[item.kind]} size={22} color={theme.accent} />}
          </View>
          <View style={styles.copy}>
            <View style={styles.meta}><Text style={[styles.kindLabel, { color: theme.accent }]}>{labels[item.kind]}</Text>{!!item.parentTitle && <Text numberOfLines={1} style={[styles.parent, { color: theme.textSecondary }]}>/ {item.parentTitle}</Text>}</View>
            <Text numberOfLines={2} style={[styles.resultTitle, { color: theme.text }]}><Match text={item.title} term={term} tint={theme.accentMuted} /></Text>
            {!!item.excerpt && <Text numberOfLines={2} style={[styles.excerpt, { color: theme.textSecondary }]}><Match text={item.excerpt} term={term} tint={theme.accentMuted} /></Text>}
          </View>
          <Feather name="arrow-up-right" size={18} color={theme.textSecondary} />
        </Pressable>
        {item.kind === "topic" && topicResources(item).length > 1 && <View style={styles.resourceLinks}>
          {topicResources(item).map((resource, index) => <Pressable key={`${resource.url}:${index}`} accessibilityRole="link" accessibilityLabel={resource.label} onPress={() => void openResource(resource)} style={[styles.resourceLink, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Feather name={resource.isFile ? "file-text" : "external-link"} size={14} color={theme.accent} />
            <Text numberOfLines={1} style={{ color: theme.accent, fontSize: 12, flexShrink: 1 }}>{resource.label}</Text>
          </Pressable>)}
        </View>}
        </View>}
        ListFooterComponent={<View style={styles.footer}>
          {!!data && data.pagination.totalPages > 1 && !searching && <View style={styles.pager}><Button label="Previous" secondary disabled={page === 1} onPress={() => { setPage(value => value - 1); results.current?.scrollToOffset({ offset: 0, animated: false }); }} /><Text style={[styles.small, { color: theme.textSecondary }]}>Page {page} of {data.pagination.totalPages}</Text><Button label="Next" secondary disabled={!data.pagination.hasNextPage} onPress={() => { setPage(value => value + 1); results.current?.scrollToOffset({ offset: 0, animated: false }); }} /></View>}
          {!isVaultUnlocked && !locked && <Pressable accessibilityRole="button" onPress={unlock} style={[styles.vaultNote, { borderColor: theme.border }]}><Feather name="lock" size={15} color={theme.textSecondary} /><Text style={[styles.small, { color: theme.textSecondary, flex: 1 }]}>Passcodes are hidden while your vault is locked.</Text><Text style={[styles.small, { color: theme.accent, fontWeight: "600" }]}>Unlock</Text><Feather name="arrow-right" size={15} color={theme.accent} /></Pressable>}
        </View>}
      />
    </View>
  </AppLayout>;
}

function Match({ text, term, tint }: { text: string; term: string; tint: string }) {
  if (!term) return <>{text}</>;
  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) return <>{text}</>;
  return <>{text.slice(0, index)}<Text style={{ backgroundColor: tint, fontWeight: "700" }}>{text.slice(index, index + term.length)}</Text>{text.slice(index + term.length)}</>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, width: "100%" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, minHeight: 64 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 18 },
  clear: { minWidth: 36, minHeight: 40, alignItems: "center", justifyContent: "center" },
  keyHint: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  tabsWrap: { borderBottomWidth: 1, marginTop: 16 },
  tabs: { gap: 22 },
  tab: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 7, borderBottomWidth: 2, paddingHorizontal: 2 },
  tabText: { fontSize: 13, fontWeight: "600" },
  count: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  start: { paddingTop: 36, gap: 12 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: "700" },
  startTitle: { fontSize: 25, fontWeight: "600", letterSpacing: -0.5 },
  scopeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12, maxWidth: 920 },
  scope: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, borderWidth: 1, borderRadius: 12 },
  scopeIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  scopeTitle: { fontSize: 14, fontWeight: "600" },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  small: { fontSize: 12, lineHeight: 18 },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 16, gap: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, fontWeight: "600", textAlign: "center" },
  emptyCopy: { fontSize: 14, lineHeight: 23, maxWidth: 560, textAlign: "center" },
  resultHeading: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, paddingVertical: 20 },
  result: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 22, paddingHorizontal: 4 },
  resourceLinks: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 16, paddingHorizontal: 4 },
  resourceLink: { flexDirection: "row", alignItems: "center", gap: 7, maxWidth: "100%", padding: 10, borderWidth: 1, borderRadius: 8 },
  resultIcon: { width: 48, height: 48, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  kindLabel: { fontSize: 11, fontWeight: "600" },
  parent: { fontSize: 11, flexShrink: 1 },
  resultTitle: { fontSize: 17, lineHeight: 24, fontWeight: "600" },
  excerpt: { fontSize: 13, lineHeight: 21 },
  footer: { paddingTop: 24, gap: 24 },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  vaultNote: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, paddingVertical: 16, borderTopWidth: 1 },
});
