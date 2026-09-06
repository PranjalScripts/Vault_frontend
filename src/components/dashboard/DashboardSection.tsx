import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  children: React.ReactNode;
  theme: any;
  actionLabel?: string;
  compactAction?: boolean;
  onAction?: () => void;
  footerLabel?: string;
  onFooter?: () => void;
  minHeight?: number;
};

export function DashboardSection({ title, children, theme, actionLabel, compactAction, onAction, footerLabel, onFooter, minHeight }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border, minHeight }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {actionLabel && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.75} style={[styles.action, compactAction && styles.squareAction, { backgroundColor: theme.accent }]}>
            <Text style={styles.actionText}>{compactAction ? "+" : `+  ${actionLabel}`}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.body}>{children}</View>
      {footerLabel && (
        <TouchableOpacity style={styles.footer} onPress={onFooter} activeOpacity={0.7}>
          <Text style={[styles.footerText, { color: theme.accent }]}>{footerLabel}  →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  header: { minHeight: 55, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  action: { minHeight: 31, paddingHorizontal: 12, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  squareAction: { width: 30, height: 30, paddingHorizontal: 0 },
  actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  body: { paddingHorizontal: 16 },
  footer: { minHeight: 42, alignItems: "center", justifyContent: "center" },
  footerText: { fontSize: 12, fontWeight: "700" },
});
