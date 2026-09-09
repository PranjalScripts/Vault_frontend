import React from "react";
import { Pressable, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Topic } from "./SubjectUI";
export type TopicStatus = "not_started" | "in_progress" | "completed";
export const topicStatus = (topic: Topic): TopicStatus =>
  topic.isCompleted ? "completed" : topic.status || "not_started";
export const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};
export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
  plain = false,
  selected = false,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  plain?: boolean;
  selected?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: plain ? 0 : 1,
        borderColor: t.border,
        borderRadius: 8,
        backgroundColor: selected
          ? t.accentMuted
          : plain
            ? "transparent"
            : t.backgroundElement,
        opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
      })}
    >
      <Feather name={icon} size={18} color={t.text} />
    </Pressable>
  );
}
export function ResourceBadge({
  count,
  kind,
  onPress,
  small = false,
}: {
  count: number;
  kind: "files" | "links";
  onPress: () => void;
  small?: boolean;
}) {
  const t = useTheme();
  const dark = useColorScheme() === "dark";
  const color = !count
    ? t.textSecondary
    : kind === "files"
      ? dark
        ? "#FF9797"
        : "#D52532"
      : dark
        ? "#7FB8FF"
        : "#0068DF";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${count} ${kind}`}
      disabled={!count}
      onPress={onPress}
      style={{
        flexDirection: "row",
        gap: 5,
        minHeight: small ? 32 : 36,
        alignItems: "center",
        borderRadius: 6,
        paddingHorizontal: small ? 6 : 9,
        backgroundColor: dark
          ? t.backgroundSelected
          : !count
            ? "#F2F4F7"
            : kind === "files"
              ? "#FFF4F5"
              : "#F1F7FF",
      }}
    >
      <Feather
        name={kind === "files" ? "file-text" : "link"}
        size={small ? 12 : 14}
        color={color}
      />
      <Text style={{ color, fontSize: small ? 11 : 12 }}>
        {count} {count === 1 ? kind.slice(0, -1) : kind}
      </Text>
    </Pressable>
  );
}
export function TopicRow({
  topic,
  compact,
  grid,
  busy,
  onEdit,
  onMenu,
  onResources,
  onStatus,
}: {
  topic: Topic;
  compact: boolean;
  grid: boolean;
  busy: boolean;
  onEdit: () => void;
  onMenu: () => void;
  onResources: () => void;
  onStatus: () => void;
}) {
  const t = useTheme();
  const dark = useColorScheme() === "dark";
  const status = topicStatus(topic);
  const color =
    status === "completed"
      ? dark
        ? "#8DDAB0"
        : "#087C35"
      : status === "in_progress"
        ? dark
          ? "#7FB8FF"
          : "#0068DF"
        : t.textSecondary;
  const badge = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Change status for ${topic.topic || `topic ${topic.srNo}`}: ${statusLabels[status]}`}
      disabled={busy}
      onPress={onStatus}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        minHeight: compact ? 32 : 36,
        paddingHorizontal: compact ? 7 : 10,
        borderRadius: 6,
        backgroundColor: dark
          ? t.backgroundSelected
          : status === "completed"
            ? "#EAF6EE"
            : status === "in_progress"
              ? "#EAF3FF"
              : "#F0F2F5",
      }}
    >
      <Feather
        name={status === "completed" ? "check-circle" : "play-circle"}
        size={compact ? 12 : 14}
        color={color}
      />
      <Text style={{ color, fontSize: compact ? 11 : 12 }}>
        {statusLabels[status]}
      </Text>
    </Pressable>
  );
  const badges = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 6 : 12,
        flexWrap: "wrap",
      }}
    >
      <ResourceBadge
        count={topic.files?.length || 0}
        kind="files"
        small={compact}
        onPress={onResources}
      />
      <ResourceBadge
        count={topic.url?.trim() ? 1 : 0}
        kind="links"
        small={compact}
        onPress={onResources}
      />
      {badge}
    </View>
  );
  if (compact)
    return (
      <View
        style={{
          padding: 12,
          gap: 12,
          borderWidth: 1,
          borderColor: dark ? t.border : "#E9EDF3",
          borderRadius: 12,
          backgroundColor: t.backgroundElement,
        }}
      >
        <View
          style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: dark ? t.backgroundSelected : "#F0F2F4",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 3,
            }}
          >
            <Text
              numberOfLines={1}
              style={{ color: t.text, fontSize: 14, fontWeight: "600" }}
            >
              {topic.srNo}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 5, paddingTop: 2 }}>
            <Text
              numberOfLines={2}
              style={{
                color: t.text,
                fontSize: 14,
                lineHeight: 20,
                fontWeight: "700",
              }}
            >
              {topic.topic || `Topic ${topic.srNo}`}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: t.textSecondary, fontSize: 12, lineHeight: 18 }}
            >
              {topic.description || "No description yet"}
            </Text>
          </View>
          <View style={{ marginTop: -5, marginRight: -7 }}>
            <IconButton
              icon="more-vertical"
              label={`Actions for ${topic.topic}`}
              onPress={onMenu}
              plain
            />
          </View>
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: dark ? t.border : "#F0F2F5",
            paddingTop: 10,
          }}
        >
          {badges}
        </View>
      </View>
    );
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: compact || grid ? "flex-start" : "center",
        gap: compact ? 10 : 16,
        padding: compact ? 12 : 16,
        borderWidth: 1,
        borderColor: dark ? t.border : "#E9EDF3",
        borderRadius: 11,
        backgroundColor: t.backgroundElement,
        minHeight: compact ? 96 : 76,
      }}
    >
      <View
        style={{
          width: compact ? 30 : 36,
          height: compact ? 30 : 36,
          borderRadius: 18,
          backgroundColor: dark ? t.backgroundSelected : "#F0F2F4",
          alignItems: "center",
          justifyContent: "center",
          marginTop: compact ? 2 : 0,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: compact ? 14 : 16,
            fontWeight: "600",
            color: t.text,
          }}
        >
          {topic.srNo}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
        <Text
          numberOfLines={2}
          style={{
            fontWeight: "700",
            fontSize: compact ? 14 : 15,
            color: t.text,
          }}
        >
          {topic.topic || `Topic ${topic.srNo}`}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: t.textSecondary, fontSize: compact ? 11 : 12 }}
        >
          {topic.description || "Add a description to this topic"}
        </Text>
        {(compact || grid) && badges}
      </View>
      {!compact && !grid && badges}
      <View style={{ flexDirection: "row", gap: 7 }}>
        {!compact && !grid && (
          <>
            <IconButton
              icon="external-link"
              label={`Open resources for ${topic.topic}`}
              onPress={onResources}
              disabled={!topic.url && !topic.files?.length}
            />
            <IconButton
              icon="edit-2"
              label={`Edit ${topic.topic}`}
              onPress={onEdit}
              disabled={busy}
            />
          </>
        )}
        <IconButton
          icon="more-vertical"
          label={`Actions for ${topic.topic}`}
          onPress={onMenu}
          plain={compact || grid}
        />
      </View>
    </View>
  );
}
