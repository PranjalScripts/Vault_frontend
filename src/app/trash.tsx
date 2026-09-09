import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { AppLayout } from "@/components/AppLayout";
import { useTheme } from "@/hooks/use-theme";
import { Button, FormModal } from "@/components/subjects/SubjectUI";
import { getTrash, restoreTrash, deleteTrashItem, emptyTrash } from "@/api/api";

type TrashItem = {
  id: string;
  kind: "todo" | "subject" | "topic" | "passcode";
  title: string;
  subjectId?: string;
  parentTitle?: string;
  deletedAt: string;
  expiresAt: string;
};
type Icon = React.ComponentProps<typeof Feather>["name"];
const itemConfig: Record<TrashItem["kind"], { label: string; plural: string; icon: Icon }> = {
  todo: { label: "To do", plural: "To dos", icon: "check-square" },
  subject: { label: "Subject", plural: "Subjects", icon: "book-open" },
  topic: { label: "Topic", plural: "Topics", icon: "file-text" },
  passcode: { label: "Passcode", plural: "Passcodes", icon: "lock" },
};
const filters = ["all", "todo", "subject", "topic", "passcode"] as const;

export default function TrashScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const mobile = width < 768;
  const [items, setItems] = useState<TrashItem[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<TrashItem | null>(null);
  const [deleting, setDeleting] = useState<TrashItem | "all" | null>(null);
  const [filter, setFilter] = useState<typeof filters[number]>("all");
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getTrash();
      setItems(response.data.data.filter((item: TrashItem) => item.kind in itemConfig));
      setDays(response.data.retentionDays);
    } catch (e: any) {
      setError(e.response?.data?.message || "Unable to load Trash. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const restore = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await restoreTrash(selected.kind, selected.id, selected.subjectId);
      setSelected(null);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message || "Unable to restore. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  const permanentlyDelete = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    setError("");
    try {
      if (deleting === "all") await emptyTrash();
      else await deleteTrashItem(deleting.kind, deleting.id, deleting.subjectId);
      setDeleting(null);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message || "Unable to delete. Please retry.");
    } finally { setBusy(false); }
  };

  const activeItems = items.filter(item => new Date(item.expiresAt).getTime() > Date.now());
  const visible = activeItems.filter(item => (filter === "all" || item.kind === filter) &&
    `${item.title} ${item.parentTitle || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const expiring = activeItems.filter(item => new Date(item.expiresAt).getTime() - Date.now() <= 3 * 86400000).length;
  const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const header = <View style={styles.header}>
    <View style={[styles.headingRow, mobile && { alignItems: "flex-start" }]}>
      <View style={{ flex: 1, gap: 8 }}>
        {!mobile && <Text style={[styles.title, { color: theme.text }]}>Recently Deleted</Text>}
        <Text style={[styles.body, { color: theme.textSecondary }]}>A second chance for things you’ve deleted.</Text>
      </View>
      {!mobile && <Button secondary danger label="Delete all" disabled={busy || loading || !activeItems.length} onPress={() => { setError(""); setDeleting("all"); }} />}
    </View>
    <View style={[styles.notice, { backgroundColor: theme.accentMuted, borderColor: theme.border }]}>
      <Feather name="clock" size={20} color={theme.accent} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>Kept for {days} days</Text>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>Restore an item to put it back. After its recovery period, it’s gone for good.</Text>
      </View>
    </View>
    <View style={styles.summary}>
      <Text style={[styles.caption, { color: theme.textSecondary }]}>{loading ? "Updating…" : `${activeItems.length} recoverable ${activeItems.length === 1 ? "item" : "items"}`}</Text>
      {expiring > 0 && <View style={styles.inline}><View style={[styles.dot, { backgroundColor: theme.danger }]} /><Text style={[styles.caption, { color: theme.danger }]}>{expiring} expiring soon</Text></View>}
    </View>
    <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Feather name="search" size={18} color={theme.textSecondary} />
      <TextInput value={search} onChangeText={setSearch} placeholder="Search deleted items" placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Search deleted items" style={[styles.input, { color: theme.text }]} />
      {!!search && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch("")} style={styles.iconButton}><Feather name="x" size={18} color={theme.textSecondary} /></Pressable>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {filters.map(kind => {
        const count = kind === "all" ? activeItems.length : activeItems.filter(item => item.kind === kind).length;
        const chosen = filter === kind;
        return <Pressable key={kind} accessibilityRole="button" accessibilityState={{ selected: chosen }}
          onPress={() => setFilter(kind)} style={({ pressed }) => [styles.filter, { borderColor: chosen ? theme.accent : theme.border,
            backgroundColor: chosen ? theme.accentMuted : theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={{ color: chosen ? theme.accent : theme.textSecondary, fontSize: 13, fontWeight: "600" }}>{kind === "all" ? "All items" : itemConfig[kind].plural}</Text>
          <Text style={{ color: chosen ? theme.accent : theme.textSecondary, fontSize: 12 }}>{count}</Text>
        </Pressable>;
      })}
    </ScrollView>
    <View style={styles.summary}>
      <Text style={[styles.caption, { color: theme.textSecondary }]}>{visible.length} {visible.length === 1 ? "item" : "items"} · Newest first</Text>
      <View style={styles.inline}>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh deleted items" disabled={loading || busy} onPress={() => void load()}
          style={({ pressed }) => [styles.iconButton, { opacity: loading || busy ? 0.4 : pressed ? 0.6 : 1 }]}>
          <Feather name="refresh-cw" size={17} color={theme.textSecondary} />
        </Pressable>
        {mobile && <Button secondary danger label="Delete all" disabled={busy || loading || !activeItems.length} onPress={() => { setError(""); setDeleting("all"); }} />}
      </View>
    </View>
    {!!error && !selected && !deleting && <View style={[styles.notice, { borderColor: theme.danger, backgroundColor: theme.backgroundElement }]}>
      <Feather name="alert-circle" size={18} color={theme.danger} /><Text accessibilityRole="alert" style={{ color: theme.danger, flex: 1 }}>{error}</Text>
      <Button secondary label="Retry" disabled={busy || loading} onPress={() => void load()} />
    </View>}
  </View>;

  return <AppLayout mobileTitle="Recently Deleted" showMobileSearch={false} scrollable={false}>
    <FlatList data={visible} keyExtractor={item => `${item.kind}:${item.id}`} ListHeaderComponent={header}
      contentContainerStyle={[styles.content, { padding: mobile ? 16 : 28 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={<View style={[styles.empty, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        {loading ? <ActivityIndicator color={theme.accent} /> : <View style={[styles.emptyIcon, { backgroundColor: theme.accentMuted }]}><Feather name={search ? "search" : "trash-2"} size={26} color={theme.accent} /></View>}
        <Text style={[styles.emptyTitle, { color: theme.text }]}>{loading ? "Loading deleted items" : error ? "Couldn’t load your items" : search ? "No matches found" : filter !== "all" ? `No deleted ${itemConfig[filter].plural.toLowerCase()}` : "Nothing in Recently Deleted"}</Text>
        <Text style={[styles.body, { color: theme.textSecondary, textAlign: "center", maxWidth: 320 }]}>{loading ? "Your items will appear here shortly." : error ? "Use Retry above to try again." : search ? "Try another name or clear your search." : "Deleted items will appear here when there’s something to recover."}</Text>
        {!!search && <Button secondary label="Clear search" onPress={() => setSearch("")} />}
      </View>}
      renderItem={({ item }) => {
        const config = itemConfig[item.kind];
        const daysLeft = Math.max(1, Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86400000));
        const urgent = daysLeft <= 3;
        return <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, wide && styles.wideCard]}>
          <View style={[styles.identity, { flex: wide ? 1 : undefined }]}>
            <View style={[styles.typeIcon, { backgroundColor: theme.background }]}><Feather name={config.icon} size={20} color={theme.accent} /></View>
            <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
              <Text numberOfLines={2} style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
              <Text numberOfLines={1} style={[styles.caption, { color: theme.textSecondary }]}>{config.label}{item.parentTitle ? ` · ${item.parentTitle}` : ""}</Text>
            </View>
          </View>
          <View style={[styles.itemBottom, !wide && { borderTopWidth: 1, borderColor: theme.border, paddingTop: 14 }]}>
            <View style={{ gap: 5, minWidth: wide ? 150 : 0, flex: wide ? undefined : 1 }}>
              <View style={styles.inline}><Feather name="clock" size={12} color={urgent ? theme.danger : theme.textSecondary} /><Text style={[styles.caption, { color: urgent ? theme.danger : theme.textSecondary }]}>{daysLeft === 1 ? "Less than a day left" : `${daysLeft} days left`}</Text></View>
              <Text style={[styles.date, { color: theme.textSecondary }]}>Deleted {date(item.deletedAt)}</Text>
            </View>
            <View style={styles.inline}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Restore ${item.title}`} disabled={busy || loading}
                onPress={() => { setError(""); setSelected(item); }} style={({ pressed }) => [styles.restore, { backgroundColor: theme.accentMuted, opacity: busy || loading ? 0.4 : pressed ? 0.7 : 1 }]}>
                <Feather name="rotate-ccw" size={15} color={theme.accent} /><Text style={{ color: theme.accent, fontWeight: "600", fontSize: 13 }}>Restore</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Permanently delete ${item.title}`} disabled={busy || loading}
                onPress={() => { setError(""); setDeleting(item); }} style={({ pressed }) => [styles.iconButton, { opacity: busy || loading ? 0.4 : pressed ? 0.6 : 1 }]}>
                <Feather name="trash-2" size={17} color={theme.danger} />
              </Pressable>
            </View>
          </View>
        </View>;
      }} />
    <FormModal visible={!!selected} title="Restore item?" subtitle={`“${selected?.title || ""}” will return to its original location.`}
      onClose={() => { if (!busy) { setSelected(null); setError(""); } }}>
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text>}
      <Button label={busy ? "Restoring…" : "Restore item"} disabled={busy} onPress={() => void restore()} />
      <Button secondary label="Cancel" disabled={busy} onPress={() => { setSelected(null); setError(""); }} />
    </FormModal>
    <FormModal visible={!!deleting} title={deleting === "all" ? "Empty Recently Deleted?" : "Delete permanently?"}
      subtitle={deleting === "all" ? "All deleted items across every section, including archived content, will be permanently removed. This cannot be undone."
        : `“${deleting?.title || ""}”${deleting && deleting.kind === "subject" ? " and its topics, notes, and resource references" : ""} will be permanently removed. This cannot be undone.`}
      onClose={() => { if (!busy) { setDeleting(null); setError(""); } }}>
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text>}
      <Button danger label={busy ? "Deleting…" : deleting === "all" ? "Delete all permanently" : "Delete permanently"} disabled={busy} onPress={() => void permanentlyDelete()} />
      <Button secondary label="Keep items" disabled={busy} onPress={() => { setDeleting(null); setError(""); }} />
    </FormModal>
  </AppLayout>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 1120, alignSelf: "center", paddingBottom: 36 },
  header: { gap: 18, paddingBottom: 12 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6 },
  body: { fontSize: 14, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 18 },
  notice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  summary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  inline: { flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { height: 5, width: 5, borderRadius: 3 },
  search: { flexDirection: "row", alignItems: "center", paddingLeft: 14, paddingRight: 4, gap: 10, borderRadius: 10, borderWidth: 1 },
  input: { flex: 1, minWidth: 0, minHeight: 46, fontSize: 14 },
  filters: { gap: 8, paddingVertical: 2 },
  filter: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, paddingHorizontal: 14, borderWidth: 1, borderRadius: 8 },
  card: { padding: 16, gap: 14, borderRadius: 12, borderWidth: 1 },
  wideCard: { flexDirection: "row", alignItems: "center", gap: 24 },
  identity: { flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  typeIcon: { height: 42, width: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 15, fontWeight: "600", lineHeight: 21 },
  itemBottom: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 },
  date: { fontSize: 11, lineHeight: 16 },
  restore: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 44, paddingHorizontal: 12, borderRadius: 8 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 12, borderRadius: 12, borderWidth: 1 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
});
