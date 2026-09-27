import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

export type FeedbackProps = { visible: boolean; title: string; message: string; onClose: () => void; buttonLabel?: string };
type Props = FeedbackProps & { kind: "success" | "error" | "info" | "confirm"; onConfirm?: () => void; busy?: boolean; error?: string; inline?: boolean };

// Same palette, 24px modal corners, 24px spacing and 44px buttons as SubjectUI.
export function FeedbackDialog({ visible, title, message, onClose, buttonLabel = "Done", kind, onConfirm, busy = false, error, inline = false }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const reducedMotion = useRef(false);
  const pressed = useRef(false);
  const cancelRef = useRef<View>(null);
  const cardRef = useRef<View>(null);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { reducedMotion.current = value; });
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", value => { reducedMotion.current = value; });
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (visible) { pressed.current = false; setMounted(true); }
    const animation = Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: reducedMotion.current ? 0 : 160, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished && !visible) setMounted(false); });
    return () => animation.stop();
  }, [visible, opacity]);
  useEffect(() => { if (!busy) pressed.current = false; }, [busy, error]);
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => (cancelRef.current as unknown as HTMLElement | null)?.focus?.(), 0);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === "Tab") {
        const card = cardRef.current as unknown as HTMLElement | null;
        const buttons = Array.from(card?.querySelectorAll<HTMLElement>('[role="button"]:not([aria-disabled="true"])') || []);
        if (!buttons.length) { event.preventDefault(); return; }
        const index = buttons.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
        else if (!event.shiftKey && (index < 0 || index === buttons.length - 1)) { event.preventDefault(); buttons[0].focus(); }
      }
    };
    document.addEventListener("keydown", escape);
    return () => { clearTimeout(timer); document.removeEventListener("keydown", escape); previous?.focus?.(); };
  }, [visible, busy, onClose]);
  if (!mounted) return null;
  const destructive = kind === "confirm" || kind === "error";
  const color = destructive ? theme.danger : theme.accent;
  const button = (label: string, action: () => void, secondary = false) => (
    <Pressable ref={secondary || kind !== "confirm" ? cancelRef : undefined} accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy || !visible}
      onPress={() => { if (pressed.current) return; pressed.current = true; action(); }}
      style={({ pressed: down }) => [styles.button, { backgroundColor: secondary ? theme.backgroundElement : color, borderColor: secondary ? theme.border : color, opacity: busy || down ? 0.55 : 1 }]}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: secondary ? theme.text : theme.background }}>{label}</Text>
    </Pressable>
  );
  const content = <Animated.View accessibilityViewIsModal style={[styles.overlay, inline && StyleSheet.absoluteFillObject, { opacity, paddingTop: Math.max(24, insets.top), paddingBottom: Math.max(24, insets.bottom) }]}>
    <View ref={cardRef} accessibilityViewIsModal role="dialog" aria-label={title} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.icon, { backgroundColor: destructive ? `${theme.danger}18` : theme.accentMuted }]}>
          <Feather name={kind === "success" ? "check-circle" : kind === "confirm" ? "trash-2" : kind === "error" ? "alert-circle" : "info"} size={27} color={color} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
        {!!error && <Text accessibilityRole="alert" style={[styles.message, { color: theme.danger }]}>{error}</Text>}
        <View style={styles.actions}>
          {kind === "confirm" && button("Cancel", onClose, true)}
          {button(busy ? "Please wait…" : buttonLabel, onConfirm || onClose)}
        </View>
      </ScrollView>
    </View>
  </Animated.View>;
  return inline ? content : <Modal transparent visible={mounted} animationType="none" statusBarTranslucent onRequestClose={() => { if (!busy) onClose(); }}>{content}</Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, zIndex: 1000, backgroundColor: "rgba(0,0,0,.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  card: { width: "100%", maxWidth: 420, maxHeight: "90%", borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  content: { padding: 24, gap: 16 },
  icon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 21, fontWeight: "700" },
  message: { fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  button: { flexGrow: 1, minWidth: 100, minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
});
