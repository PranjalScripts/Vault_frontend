import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Todo } from "@/features/todos/features/types";

import { SwipeToComplete } from "./SwipeToComplete";

const categoryColors: Record<Todo["category"], { bg: string; fg: string }> = { Work: { bg: "#EEE9FF", fg: "#6540DB" }, Study: { bg: "#E7F6EC", fg: "#16753D" }, Personal: { bg: "#F2EAFF", fg: "#6939D1" }, Health: { bg: "#E7F1FF", fg: "#1761C9" }, Other: { bg: "#F1F1EF", fg: "#62645E" } };
const priorityColors = { high: { bg: "#FFE9E7", fg: "#DB3D2F", icon: "↑" }, medium: { bg: "#FFF1DF", fg: "#DB7908", icon: "•" }, low: { bg: "#E7F6EC", fg: "#16753D", icon: "↓" } };

const formatDueDate = (value?: string | null) => {
  if (!value) return "No due date";
  const date = new Date(value); const today = new Date(); const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay(date, today)) return `Today, ${time}`;
  if (sameDay(date, tomorrow)) return `Tomorrow, ${time}`;
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

export function TodoCard({ item, theme, isMobile, swipeEnabled = false, updating = false, onToggle, onEdit, onDelete }: { item: Todo; theme: any; isMobile: boolean; swipeEnabled?: boolean; updating?: boolean; onToggle: (todo: Todo) => void; onEdit: (todo: Todo) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const category = Object.hasOwn(categoryColors, item.category) ? categoryColors[item.category] : categoryColors.Other;
  const priority = priorityColors[item.priority] || priorityColors.medium;
  const due = formatDueDate(item.dueDate);
  const dueToday = due.startsWith("Today");

  const checkbox = <TouchableOpacity disabled={updating} accessibilityLabel={item.isCompleted ? "Mark task pending" : "Mark task completed"} accessibilityRole="checkbox" accessibilityState={{ checked: item.isCompleted, disabled: updating }} onPress={() => onToggle(item)} style={[styles.checkbox, { borderColor: item.isCompleted ? theme.accent : theme.textSecondary, backgroundColor: item.isCompleted ? theme.accent : "transparent" }]}>{item.isCompleted && <Text style={styles.tick}>✓</Text>}</TouchableOpacity>;

  if (isMobile) return <SwipeToComplete enabled={swipeEnabled && !item.isCompleted && !updating} onComplete={() => { if (!item.isCompleted) onToggle(item); }} color={theme.accent} foreground={theme.background}><View style={[styles.mobileCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
    <View style={styles.mobileTop}>{checkbox}<View style={styles.mobileTitleWrap}><Text style={[styles.title, item.isCompleted && styles.completed, { color: theme.text }]}>{item.title}</Text><View style={styles.categoryLine}><View style={[styles.categoryDot, { backgroundColor: category.fg }]} /><Text style={[styles.mobileCategory, { color: theme.textSecondary }]}>{item.category}</Text></View></View><View><Text style={[styles.mobileDue, { color: dueToday ? "#F05A35" : theme.textSecondary }]}>{due.split(", ")[0]}</Text>{due.includes(", ") && <Text style={[styles.mobileTime, { color: dueToday ? "#F05A35" : theme.text }]}>{due.split(", ")[1]}</Text>}</View></View>
    {!!item.description && <><Text numberOfLines={expanded ? undefined : 2} style={[styles.mobileDescription, { color: theme.textSecondary }]}>{item.description}</Text>{item.description.length > 90 && <TouchableOpacity onPress={() => setExpanded((value) => !value)}><Text style={[styles.readMore, { color: theme.accent }]}>{expanded ? "Show less" : "Read more"}</Text></TouchableOpacity>}</>}
    <View style={styles.mobileActions}><TouchableOpacity onPress={() => onEdit(item)} style={[styles.mobileAction, { borderColor: theme.border }]}><Text style={[styles.mobileActionText, { color: theme.accent }]}>✎  Edit</Text></TouchableOpacity><TouchableOpacity onPress={() => onDelete(item._id)} style={[styles.mobileAction, { borderColor: `${theme.danger}35` }]}><Text style={[styles.mobileActionText, { color: theme.danger }]}>⌫  Delete</Text></TouchableOpacity></View>
  </View></SwipeToComplete>;

  return <View style={[styles.desktopRow, { borderTopColor: theme.border }]}>
    <View style={styles.checkCell}>{checkbox}</View>
    <View style={styles.taskCell}><Text style={[styles.title, item.isCompleted && styles.completed, { color: theme.text }]}>{item.title}</Text>{!!item.description && <><Text numberOfLines={expanded ? undefined : 2} style={[styles.description, { color: theme.textSecondary }]}>{item.description}</Text>{item.description.length > 105 && <TouchableOpacity onPress={() => setExpanded((value) => !value)}><Text style={[styles.readMore, { color: theme.accent }]}>{expanded ? "Show less" : "Read more"}</Text></TouchableOpacity>}</>}</View>
    <View style={styles.categoryCell}><View style={[styles.badge, { backgroundColor: category.bg }]}><Text numberOfLines={2} style={[styles.badgeText, { color: category.fg }]}>{item.category}</Text></View></View>
    <View style={styles.dueCell}><Text style={styles.calendar}>□</Text><Text style={[styles.dueText, { color: dueToday ? "#F05A35" : theme.textSecondary }]}>{due}</Text></View>
    <View style={styles.priorityCell}><View style={[styles.badge, { backgroundColor: priority.bg }]}><Text style={[styles.badgeText, { color: priority.fg }]}>{priority.icon} {item.priority[0].toUpperCase() + item.priority.slice(1)}</Text></View></View>
    <View style={styles.statusCell}><View style={[styles.statusRing, { borderColor: item.isCompleted ? theme.accent : theme.textSecondary }]}>{item.isCompleted && <View style={[styles.statusInner, { backgroundColor: theme.accent }]} />}</View><Text style={[styles.statusText, { color: theme.textSecondary }]}>{item.isCompleted ? "Completed" : "Pending"}</Text></View>
    <View style={styles.actionCell}><TouchableOpacity accessibilityLabel="Edit task" onPress={() => onEdit(item)} style={[styles.iconAction, { backgroundColor: theme.accentMuted }]}><Text style={[styles.iconActionText, { color: theme.accent }]}>✎</Text></TouchableOpacity><TouchableOpacity accessibilityLabel="Delete task" onPress={() => onDelete(item._id)} style={[styles.iconAction, { backgroundColor: `${theme.danger}12` }]}><Text style={[styles.iconActionText, { color: theme.danger }]}>⌫</Text></TouchableOpacity></View>
  </View>;
}

const styles = StyleSheet.create({
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.4, alignItems: "center", justifyContent: "center" }, tick: { color: "#fff", fontSize: 11, fontWeight: "900" }, completed: { textDecorationLine: "line-through", opacity: .55 }, title: { fontSize: 12.5, lineHeight: 18, fontWeight: "700" }, description: { fontSize: 11, lineHeight: 16, marginTop: 3 }, readMore: { fontSize: 10.5, fontWeight: "700", marginTop: 2 },
  desktopRow: { minHeight: 78, flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 }, checkCell: { width: "5%", alignItems: "center" }, taskCell: { width: "35%", paddingRight: 14 }, categoryCell: { width: "11%" }, dueCell: { width: "17%", flexDirection: "row", alignItems: "center", gap: 7, paddingRight: 8 }, priorityCell: { width: "11%" }, statusCell: { width: "13%", flexDirection: "row", alignItems: "center", gap: 7 }, actionCell: { width: "8%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, iconAction: { width: 29, height: 29, borderRadius: 7, alignItems: "center", justifyContent: "center" }, iconActionText: { fontSize: 14, fontWeight: "700" },
  badge: { maxWidth: "100%", alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }, badgeText: { fontSize: 10.5, fontWeight: "700", textTransform: "capitalize" }, calendar: { fontSize: 15, color: "#637086" }, dueText: { fontSize: 10.5, fontWeight: "600", flexShrink: 1 }, statusRing: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.3, alignItems: "center", justifyContent: "center" }, statusInner: { width: 5, height: 5, borderRadius: 3 }, statusText: { fontSize: 10.5 }, menu: { width: 25, alignItems: "center" }, menuText: { fontSize: 20, lineHeight: 23 },
  mobileCard: { borderWidth: 1, borderRadius: 14, padding: 13 }, mobileTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, mobileTitleWrap: { flex: 1, minWidth: 0 }, categoryLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }, categoryDot: { width: 6, height: 6, borderRadius: 3 }, mobileCategory: { fontSize: 10.5 }, mobileDue: { fontSize: 10.5, fontWeight: "700", textAlign: "right" }, mobileTime: { fontSize: 10.5, fontWeight: "700", marginTop: 4, textAlign: "right" }, mobileDescription: { fontSize: 11.5, lineHeight: 17, marginTop: 11, marginLeft: 28 }, mobileActions: { flexDirection: "row", justifyContent: "flex-end", gap: 7, marginTop: 11 }, mobileAction: { minHeight: 31, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" }, mobileActionText: { fontSize: 10.5, fontWeight: "700" },
});
