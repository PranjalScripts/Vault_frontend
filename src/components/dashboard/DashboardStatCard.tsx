import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  value: number;
  detail: string;
  icon: string;
  accent: string;
  tint: string;
  borderColor: string;
  iconBackground: string;
  compact: boolean;
  textColor: string;
  mutedColor: string;
};

export function DashboardStatCard({
  title,
  value,
  detail,
  icon,
  accent,
  tint,
  borderColor,
  iconBackground,
  compact,
  textColor,
  mutedColor,
}: Props) {
  return (
    <View style={[styles.card, compact && styles.compactCard, { backgroundColor: tint, borderColor }]}>
      <View style={styles.headingRow}>
        <View style={[styles.iconBadge, compact && styles.compactIcon, { backgroundColor: iconBackground }]}>
          <Text style={[styles.icon, compact && styles.compactIconText, { color: accent }]}>{icon}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.title, compact && styles.compactTitle, { color: textColor }]}>{title}</Text>
      </View>
      <Text style={[styles.value, compact && styles.compactValue, { color: textColor }]}>{value}</Text>
      <View style={styles.detailRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text numberOfLines={1} style={[styles.detail, compact && styles.compactDetail, { color: mutedColor }]}>{detail}</Text>
      </View>
      <View style={styles.sparkline}>
        {[5, 10, 7, 15, 12].map((height, index) => (
          <View key={index} style={[styles.sparkBar, { height, backgroundColor: accent }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 146, borderWidth: 1, borderRadius: 16, padding: 18, overflow: "hidden" },
  compactCard: { minHeight: 116, padding: 12, borderRadius: 14 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  iconBadge: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  compactIcon: { width: 27, height: 27, borderRadius: 7 },
  icon: { fontSize: 17 },
  compactIconText: { fontSize: 14 },
  title: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  compactTitle: { fontSize: 11 },
  value: { fontSize: 31, lineHeight: 37, fontWeight: "800", marginTop: 14 },
  compactValue: { fontSize: 25, lineHeight: 30, marginTop: 9 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5, paddingRight: 34 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  detail: { fontSize: 12, flexShrink: 1 },
  compactDetail: { fontSize: 9.5 },
  sparkline: { position: "absolute", right: 14, bottom: 17, height: 18, flexDirection: "row", alignItems: "flex-end", gap: 2, opacity: 0.85 },
  sparkBar: { width: 3, borderRadius: 2 },
});
