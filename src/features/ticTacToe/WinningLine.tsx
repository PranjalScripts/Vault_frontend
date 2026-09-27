import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

type Point = { x: number; y: number };

export function WinningLine({ start, end, color }: { start: Point; end: Point; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;
  const dx = end.x - start.x, dy = end.y - start.y;
  const length = Math.hypot(dx, dy) + 28;
  const angle = `${Math.atan2(dy, dx)}rad` as `${number}rad`;

  useEffect(() => {
    let active = true;
    const finish = () => { progress.stopAnimation(); progress.setValue(1); };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => { if (reduced) finish(); });
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active) return;
      if (reduced) finish();
      else Animated.timing(progress, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }).catch(finish);
    return () => { active = false; subscription.remove(); progress.stopAnimation(); };
  }, [progress]);

  return <View testID="tic-winning-line" pointerEvents="none" accessible={false} style={{ position: 'absolute', left: (start.x + end.x) / 2 - length / 2, top: (start.y + end.y) / 2 - 3, width: length, height: 6, transform: [{ rotate: angle }] }}>
    <Animated.View style={{ height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.85, width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, length] }) }} />
  </View>;
}
