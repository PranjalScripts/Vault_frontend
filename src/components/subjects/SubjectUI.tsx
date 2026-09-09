import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

export type SubjectFile = {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "document" | "video" | "audio" | "other";
  mimeType?: string;
  fileSize?: number;
  createdAt?: string;
  updatedAt?: string;
};
export type SubjectStats = {
  subjects: number;
  topics: number;
  links: number;
  completed: number;
  files: number;
  withLinksPercent: number;
};
export type Topic = {
  _id?: string;
  srNo: number;
  isCompleted?: boolean;
  description?: string;
  status?: "not_started" | "in_progress" | "completed";
  files?: SubjectFile[];
  createdAt?: string;
  updatedAt?: string;
  topic: string;
  url?: string;
};
export type Subject = {
  _id: string;
  subjectName: string;
  description?: string;
  notes?: string;
  topics: Topic[];
  createdAt?: string;
  updatedAt?: string;
};
export function Button({
  label,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary
            ? t.backgroundElement
            : danger
              ? t.danger
              : t.accent,
          borderColor: t.border,
          borderWidth: secondary ? 1 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: secondary ? (danger ? t.danger : t.text) : t.background,
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  url = false,
  numeric = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  url?: boolean;
  numeric?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.label, { color: t.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.textSecondary}
        autoCapitalize={url ? "none" : "sentences"}
        keyboardType={numeric ? "numeric" : url ? "url" : "default"}
        style={[
          s.input,
          {
            color: t.text,
            backgroundColor: t.background,
            borderColor: t.border,
          },
        ]}
      />
    </View>
  );
}
export function Search({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        s.search,
        { backgroundColor: t.backgroundElement, borderColor: t.border },
      ]}
    >
      <Text style={{ color: t.textSecondary, fontSize: 22 }}>⌕</Text>
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={t.textSecondary}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          minWidth: 0,
          color: t.text,
          fontSize: 14,
          paddingVertical: 12,
        }}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
          style={s.clear}
        >
          <Text style={{ color: t.textSecondary }}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
export function FormModal({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
        style={[
          s.overlay,
          { justifyContent: width < 768 ? "flex-end" : "center", paddingTop: insets.top },
        ]}
      >
        <View
          accessibilityViewIsModal
          style={[
            s.modal,
            {
              backgroundColor: t.backgroundElement,
              borderRadius: width < 768 ? 0 : 24,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: Math.max(24, insets.bottom),
              flexShrink: 1,
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 20 }}
          >
            <View style={s.row}>
              <Text style={[s.modalTitle, { color: t.text }]}>{title}</Text>
              <Button label="Close" secondary onPress={onClose} />
            </View>
            <Text style={[s.body, { color: t.textSecondary }]}>{subtitle}</Text>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function Empty({
  title,
  description,
  action,
  onPress,
  loading = false,
}: {
  title: string;
  description: string;
  action?: string;
  onPress?: () => void;
  loading?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        s.empty,
        { borderColor: t.border, backgroundColor: t.backgroundElement },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.accent} />
      ) : (
        <View style={[s.icon, { backgroundColor: t.accentMuted }]}>
          <Text style={{ fontSize: 26, color: t.accent }}>▤</Text>
        </View>
      )}
      <Text style={[s.modalTitle, { color: t.text, textAlign: "center" }]}>
        {title}
      </Text>
      <Text
        style={[
          s.body,
          { color: t.textSecondary, textAlign: "center", maxWidth: 320 },
        ]}
      >
        {description}
      </Text>
      {action && onPress && <Button label={action} onPress={onPress} />}
    </View>
  );
}
export const s = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    gap: 24,
    paddingBottom: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginTop: 8,
    marginBottom: 8,
  },
  body: { fontSize: 14, lineHeight: 22 },
  button: {
    minHeight: 44,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  search: {
    flex: 1,
    minWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
  },
  clear: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.45)",
    alignItems: "center",
  },
  modal: { width: "100%", maxWidth: 520, maxHeight: "90%", padding: 24 },
  modalTitle: { fontSize: 21, fontWeight: "700", flexShrink: 1 },
  empty: {
    padding: 36,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    gap: 14,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  card: { borderWidth: 1, borderRadius: 18, padding: 22, gap: 18 },
  error: { fontSize: 13, lineHeight: 20 },
});
