import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
/** Brief opacity transition for a newly placed segment; positions stay exact. */
export function PathSegment({ style }: { style: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(.65)).current;
  useEffect(() => {
    const animation = Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: Platform.OS !== 'web' });
    animation.start(); return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={[style, { opacity }]} />;
}
