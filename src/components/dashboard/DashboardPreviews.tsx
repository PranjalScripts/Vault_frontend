import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import type { Todo } from "@/app/todos/features/types";
import type { Passcode } from "@/app/passcodes/types";
import { getPlatformIcon } from "@/app/passcodes/utils/passcodeCrypto";

export type DashboardSubject = { _id: string; subjectName: string; topics?: { _id?: string; topic: string }[] };

const Empty = ({ label, theme }: { label: string; theme: any }) => (
  <View style={styles.empty}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>{label}</Text></View>
);

export function TodoPreview({ todos, loading, theme, onToggle }: { todos: Todo[]; loading: boolean; theme: any; onToggle: (todo: Todo) => void }) {
  if (loading) return <ActivityIndicator style={styles.loader} color={theme.accent} />;
  if (!todos.length) return <Empty label="No todos yet. Add one to get started." theme={theme} />;
  return <>{todos.slice(0, 4).map((todo, index) => (
    <TouchableOpacity key={todo._id} onPress={() => onToggle(todo)} activeOpacity={0.7} style={[styles.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.checkbox, { borderColor: todo.isCompleted ? theme.accent : theme.textSecondary, backgroundColor: todo.isCompleted ? theme.accent : "transparent" }]}>
        {todo.isCompleted && <Text style={styles.check}>✓</Text>}
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={[styles.primary, { color: theme.text, textDecorationLine: todo.isCompleted ? "line-through" : "none", opacity: todo.isCompleted ? 0.55 : 1 }]}>{todo.title}</Text>
        {!!todo.description && <Text numberOfLines={1} style={[styles.secondary, { color: theme.textSecondary }]}>{todo.description}</Text>}
      </View>
      <Text style={[styles.status, { color: todo.isCompleted ? theme.accent : theme.textSecondary }]}>{todo.isCompleted ? "Done" : "Open"}</Text>
    </TouchableOpacity>
  ))}</>;
}

export function SubjectsPreview({ subjects, loading, theme, onOpen }: { subjects: DashboardSubject[]; loading: boolean; theme: any; onOpen: (id: string) => void }) {
  if (loading) return <ActivityIndicator style={styles.loader} color={theme.accent} />;
  if (!subjects.length) return <Empty label="No subjects yet. Create your first subject." theme={theme} />;
  return <>{subjects.slice(0, 3).map((subject, index) => (
    <TouchableOpacity key={subject._id} onPress={() => onOpen(subject._id)} activeOpacity={0.7} style={[styles.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.itemIcon, { backgroundColor: index % 2 ? "#EAF7EE" : "#F1ECFF" }]}><Text>{index % 2 ? "▣" : "▤"}</Text></View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={[styles.primary, { color: theme.text }]}>{subject.subjectName}</Text>
        <Text style={[styles.secondary, { color: theme.textSecondary }]}>{subject.topics?.length || 0} {(subject.topics?.length || 0) === 1 ? "topic" : "topics"}</Text>
      </View>
      <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
    </TouchableOpacity>
  ))}</>;
}

export function PasscodesPreview({ passcodes, loading, unlocked, theme }: { passcodes: Passcode[]; loading: boolean; unlocked: boolean; theme: any }) {
  if (loading) return <ActivityIndicator style={styles.loader} color={theme.accent} />;
  if (!unlocked) return <View style={styles.locked}><View style={[styles.lockIcon, { backgroundColor: theme.accentMuted }]}><Text>🔒</Text></View><View><Text style={[styles.primary, { color: theme.text }]}>Vault locked</Text><Text style={[styles.secondary, { color: theme.textSecondary }]}>Open Passcodes to unlock and view entries.</Text></View></View>;
  if (!passcodes.length) return <Empty label="No passcodes saved yet." theme={theme} />;
  return <>{passcodes.slice(0, 3).map((item, index) => (
    <View key={item._id} style={[styles.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.itemIcon, { backgroundColor: theme.accentMuted }]}><Text>{getPlatformIcon(item.platform)}</Text></View>
      <View style={styles.rowCopy}><Text numberOfLines={1} style={[styles.primary, { color: theme.text }]}>{item.platform}</Text><Text numberOfLines={1} style={[styles.secondary, { color: theme.textSecondary }]}>{item.username}</Text></View>
      <Text style={[styles.mask, { color: theme.textSecondary }]}>••••••••</Text>
    </View>
  ))}</>;
}

export function ActivityOverview({ completed, subjects, passcodes, theme }: { completed: number; subjects: number; passcodes: number; theme: any }) {
  const { width } = useWindowDimensions();
  const items = [{ label: "Todos completed", value: completed, color: "#6D42F5" }, { label: "Subjects", value: subjects, color: "#25A65A" }, { label: "Passcodes", value: passcodes, color: "#2878F0" }];
  return <View style={[styles.activity, width < 420 && styles.mobileActivity]}>
    <View style={styles.ring}>
      <View style={[styles.quarter, { backgroundColor: items[0].color }]} /><View style={[styles.quarter, { backgroundColor: items[1].color }]} /><View style={[styles.quarter, { backgroundColor: items[2].color }]} /><View style={[styles.quarter, { backgroundColor: "#F2A319" }]} />
      <View style={[styles.ringCenter, { backgroundColor: theme.backgroundElement }]}><Text style={[styles.ringTotal, { color: theme.text }]}>{completed + subjects + passcodes}</Text><Text style={[styles.ringLabel, { color: theme.textSecondary }]}>total</Text></View>
    </View>
    <View style={styles.legend}>{items.map((item) => <View key={item.label} style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: item.color }]} /><Text style={[styles.legendLabel, { color: theme.text }]}>{item.label}</Text><Text style={[styles.legendValue, { color: theme.textSecondary }]}>{item.value}</Text></View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  loader: { marginVertical: 40 }, empty: { minHeight: 112, alignItems: "center", justifyContent: "center" }, emptyText: { fontSize: 13, textAlign: "center" },
  row: { minHeight: 61, flexDirection: "row", alignItems: "center", gap: 11 }, checkbox: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 4, alignItems: "center", justifyContent: "center" }, check: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  rowCopy: { flex: 1, minWidth: 0 }, primary: { fontSize: 13, fontWeight: "600" }, secondary: { fontSize: 11, marginTop: 3 }, status: { fontSize: 10, fontWeight: "600" },
  itemIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" }, chevron: { fontSize: 23 }, mask: { fontSize: 12, letterSpacing: 1 },
  locked: { minHeight: 135, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }, lockIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  activity: { minHeight: 207, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40, paddingVertical: 23 }, ring: { width: 126, height: 126, borderRadius: 63, overflow: "hidden", flexDirection: "row", flexWrap: "wrap" }, quarter: { width: 63, height: 63 }, ringCenter: { position: "absolute", width: 74, height: 74, borderRadius: 37, top: 26, left: 26, alignItems: "center", justifyContent: "center" }, ringTotal: { fontSize: 20, fontWeight: "800" }, ringLabel: { fontSize: 10 },
  mobileActivity: { flexDirection: "column", gap: 22 },
  legend: { minWidth: 150, gap: 14 }, legendRow: { flexDirection: "row", alignItems: "center" }, legendDot: { width: 8, height: 8, borderRadius: 3, marginRight: 8 }, legendLabel: { flex: 1, fontSize: 12 }, legendValue: { fontSize: 12, fontWeight: "700" },
});
