import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from "react-native";

/** Horizontal intent is required so ordinary vertical scrolling remains available. */
export function SwipeToComplete({ children, enabled, onComplete, color, foreground }: {
  children: React.ReactNode;
  enabled: boolean;
  onComplete: () => void;
  color: string;
  foreground: string;
}) {
  const offset = useRef(new Animated.Value(0)).current;
  const current = useRef({ enabled, onComplete });
  current.current = { enabled, onComplete };
  const settling = useRef(false);
  const cardWidth = useRef(0);
  useEffect(() => {
    if (!enabled) {
      offset.stopAnimation();
      offset.setValue(0);
      settling.current = false;
    }
    return () => offset.stopAnimation();
  }, [enabled, offset]);
  const responder = useMemo(() => {
    const reset = () => {
      Animated.spring(offset, { toValue: 0, useNativeDriver: Platform.OS !== "web", tension: 90, friction: 12 }).start(() => { settling.current = false; });
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => current.current.enabled && cardWidth.current > 0 && !settling.current && gesture.numberActiveTouches === 1 && gesture.dx < -12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_, gesture) => offset.setValue(Math.max(-cardWidth.current, Math.min(0, gesture.dx))),
      onPanResponderRelease: (_, gesture) => {
        settling.current = true;
        const complete = current.current.enabled && gesture.dx <= -80 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
        if (complete) {
          // Finish the exit before changing task status, which reorders the list.
          Animated.timing(offset, {
            toValue: -cardWidth.current - 24,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
          }).start(({ finished }) => {
            if (!finished) return;
            if (current.current.enabled) current.current.onComplete();
            else reset();
          });
        } else reset();
      },
      onPanResponderTerminate: reset,
      onPanResponderTerminationRequest: () => true,
    });
  }, [offset]);

  return <View onLayout={event => { cardWidth.current = event.nativeEvent.layout.width; }} style={styles.container}>
    {enabled && <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.action, { backgroundColor: color }]}>
      <Text style={[styles.check, { color: foreground }]}>✓</Text>
      <Text style={[styles.label, { color: foreground }]}>Complete</Text>
    </View>}
    <Animated.View {...(enabled ? responder.panHandlers : {})} style={[{ transform: [{ translateX: offset }] }, Platform.OS === "web" && enabled ? { touchAction: "pan-y" } : {}]}>
      {children}
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  container: { borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  action: { ...StyleSheet.absoluteFillObject, alignItems: "flex-end", justifyContent: "center", paddingRight: 20, gap: 4 },
  check: { fontSize: 24, fontWeight: "700", paddingRight: 22 },
  label: { fontSize: 12, fontWeight: "700" },
});
