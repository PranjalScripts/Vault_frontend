import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AppLayout } from "@/components/AppLayout";
import { Button, FormModal } from "@/components/subjects/SubjectUI";
import { useTheme } from "@/hooks/use-theme";
import { getTrash, restoreTrash } from "@/api/api";

type TrashItem = {
  id: string;
  kind: "todo" | "subject" | "topic" | "notes";
  title: string;
  subjectId?: string;
  parentTitle?: string;
  preview?: string;
  deletedAt: string;
  expiresAt: string;
};
const labels = { todo: "Todo", subject: "Subject", topic: "Topic", notes: "Notes" };
export default function TrashScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<TrashItem | null>(null);
  const [filter, setFilter] = useState("all");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getTrash();
      setItems(response.data.data);
      setDays(response.data.retentionDays);
    } catch (e: any) {
      setError(e.response?.data?.message || "Unable to load Trash. Please retry.");
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
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
    } finally { setBusy(false); }
  };
  const visible = items.filter(item => (filter === "all" || item.kind === filter) && new Date(item.expiresAt).getTime() > Date.now());
  return (
    <AppLayout title="Recently Deleted" mobileTitle="Recently Deleted" subtitle="A second chance for things you deleted.">
      <View style={{ padding: 20, gap: 18 }}>
        <Text style={{ color: theme.textSecondary, lineHeight: 22 }}>
          Deleted items can be restored for {days} days, then are permanently removed. Restoring a subject also brings back its topics and notes. Cleared subject notes appear here too.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {["all", "todo", "subject", "topic", "notes"].map(kind => <Button key={kind} label={kind === "all" ? "All items" : labels[kind as keyof typeof labels]} secondary={filter !== kind} onPress={() => setFilter(kind)} />)}
          <Button label="Refresh" secondary disabled={loading || busy} onPress={() => void load()} />
        </View>
        {!!error && !selected && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text>}
        {loading ? <ActivityIndicator color={theme.accent} /> : !visible.length ? (
          <View style={{ padding: 32, alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 32 }}>🗑️</Text>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "600" }}>{error ? "Trash unavailable" : "Nothing here to restore"}</Text>
            <Text style={{ color: theme.textSecondary }}>Deleted items will appear here during their restore period.</Text>
          </View>
        ) : visible.map(item => (
          <View key={`${item.kind}:${item.id}`} style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement, borderRadius: 14, padding: 18, gap: 10 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{labels[item.kind]}{item.parentTitle ? ` · ${item.parentTitle}` : ""}</Text>
            <Text style={{ color: theme.text, fontWeight: "600", fontSize: 17 }}>{item.title}</Text>
            {!!item.preview && <Text numberOfLines={3} style={{ color: theme.textSecondary }}>{item.preview}</Text>}
            <Text style={{ color: theme.textSecondary }}>Deleted {new Date(item.deletedAt).toLocaleDateString()} · {Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86400000)} days left</Text>
            <Button label="Restore" disabled={busy} onPress={() => { setError(""); setSelected(item); }} />
          </View>
        ))}
      </View>
      <FormModal visible={!!selected} title="Restore item?" subtitle={selected ? `Restore “${selected.title}” to its original location?` : ""} onClose={() => { if (!busy) { setSelected(null); setError(""); } }}>
        {!!error && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{error}</Text>}
        <Button label={busy ? "Restoring…" : "Restore"} disabled={busy} onPress={() => void restore()} />
        <Button label="Cancel" secondary disabled={busy} onPress={() => { setSelected(null); setError(""); }} />
      </FormModal>
    </AppLayout>
  );
}
