import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ARENA_COLORS, FEEDBACK, MOMENTUM } from '../config';
import { TouchPoint, TouchTracker } from '../input';
import { MatchSnapshot, Mode, Player } from '../types';
type ArenaProps = {
  snapshot: MatchSnapshot; mode: Mode; enabled: boolean; reducedMotion: boolean;
  boundary: SharedValue<number>; redPulse: SharedValue<number>; bluePulse: SharedValue<number>;
  onTaps: (players: readonly Player[]) => boolean;
};
export const BattleArena = memo(function BattleArena(props: ArenaProps) {
  const latest = useRef(props); latest.current = props;
  const tracker = useRef(new TouchTracker()), dimensions = useRef({ width: 1, height: 1 });
  const height = useSharedValue(1), redX = useSharedValue(0), redY = useSharedValue(0), blueX = useSharedValue(0), blueY = useSharedValue(0);
  const redRipple = useSharedValue(0), blueRipple = useSharedValue(0);
  useEffect(() => { if (!props.enabled) tracker.current.clear(); }, [props.enabled]);
  const handleDown = (points: readonly TouchPoint[]) => {
    const current = latest.current, { width, height: areaHeight } = dimensions.current;
    const taps = tracker.current.down(points, width, areaHeight, current.boundary.value, current.mode);
    if (!current.enabled || !taps.length || !current.onTaps(taps.map(t => t.player))) return;
    if (current.reducedMotion) return;
    for (const tap of taps) {
      if (tap.player === 'red') { redX.value = tap.x; redY.value = tap.y; redRipple.value = 0; redRipple.value = withTiming(1, { duration: FEEDBACK.rippleMs }); }
      else { blueX.value = tap.x; blueY.value = tap.y; blueRipple.value = 0; blueRipple.value = withTiming(1, { duration: FEEDBACK.rippleMs }); }
    }
  };
  const down = useRef(handleDown); down.current = handleDown;
  const gesture = useMemo(() => Gesture.Manual().runOnJS(true).shouldCancelWhenOutside(false)
    .onTouchesDown((event, manager) => { manager.activate(); down.current(event.changedTouches); })
    .onTouchesUp((event, manager) => { tracker.current.up(event.changedTouches.map(t => t.id)); if (event.numberOfTouches === 0) manager.end(); })
    .onTouchesCancelled((_event, manager) => { tracker.current.clear(); manager.fail(); })
    .onFinalize(() => tracker.current.clear()), []);
  const boundary = props.boundary, redPulse = props.redPulse, bluePulse = props.bluePulse;
  const redTerritory = useAnimatedStyle(() => ({ transform: [{ translateY: (boundary.value - 1) * height.value }] }));
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: boundary.value * height.value - 3 }] }));
  const glow = useAnimatedStyle(() => ({ opacity: .12 + Math.max(redPulse.value, bluePulse.value) * 2 }));
  const redFlash = useAnimatedStyle(() => ({ opacity: redPulse.value }));
  const blueFlash = useAnimatedStyle(() => ({ opacity: bluePulse.value }));
  const redRing = useAnimatedStyle(() => ({ opacity: 1 - redRipple.value, transform: [{ translateX: redX.value - 22 }, { translateY: redY.value - 22 }, { scale: .4 + redRipple.value * 1.6 }] }));
  const blueRing = useAnimatedStyle(() => ({ opacity: 1 - blueRipple.value, transform: [{ translateX: blueX.value - 22 }, { translateY: blueY.value - 22 }, { scale: .4 + blueRipple.value * 1.6 }] }));
  useEffect(() => { redRipple.value = 1; blueRipple.value = 1; }, [redRipple, blueRipple]);
  const { snapshot, mode } = props;
  const hud = (player: Player) => {
    const m = snapshot[player], danger = snapshot[`${player}Power`] < 30, critical = snapshot[`${player}Power`] < 15;
    const name = mode === 'computer' ? player === 'red' ? 'CPU · RED' : 'YOU · BLUE' : player.toUpperCase();
    return <View pointerEvents="none" style={[s.hud, player === 'red' ? { top: 22, transform: [{ rotate: mode === 'local' ? '180deg' : '0deg' }] } : { bottom: 22 }]}>
      <Text style={s.name}>{name}</Text><Text style={s.speed}>{m.rollingTPS.toFixed(1)} <Text style={s.unit}>TPS</Text></Text>
      <Text style={s.detail}>{danger ? critical ? 'PUSH!' : 'HOLD YOUR GROUND' : m.rollingTPS >= MOMENTUM.pressureTPS ? 'KEEP THE PRESSURE' : 'TAP YOUR TERRITORY'}</Text>
    </View>;
  };
  return <GestureHandlerRootView style={s.root}>
    <GestureDetector gesture={gesture} touchAction="none" userSelect="none">
      <View testID="tap-clash-arena" accessible={false} onLayout={event => { dimensions.current = event.nativeEvent.layout; height.value = event.nativeEvent.layout.height; }} style={[s.arena, Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none' } : {}]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: ARENA_COLORS.blue }]} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, blueFlash]} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: ARENA_COLORS.red }, redTerritory]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, redFlash]} />
        </Animated.View>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {hud('red')}{hud('blue')}
          <Animated.View style={[s.boundary, line]}>
            <Animated.View style={[s.glow, glow]} />
            <View style={s.line} />
            <View style={s.notch} />
            <View style={[s.notch, { left: '67%', transform: [{ rotate: '45deg' }] }]} />
          </Animated.View>
          <Animated.View style={[s.ripple, redRing]} /><Animated.View style={[s.ripple, blueRing]} />
        </View>
      </View>
    </GestureDetector>
  </GestureHandlerRootView>;
});
const s = StyleSheet.create({
  root: { flex: 1, width: '100%' }, arena: { flex: 1, overflow: 'hidden', minHeight: 240 },
  hud: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 5 },
  name: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 3 },
  speed: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'] }, unit: { fontSize: 14, fontWeight: '600' },
  detail: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  boundary: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  line: { height: 6, backgroundColor: ARENA_COLORS.line },
  glow: { position: 'absolute', top: -9, height: 24, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12 },
  notch: { position: 'absolute', left: '30%', top: -5, width: 16, height: 16, backgroundColor: ARENA_COLORS.line, transform: [{ rotate: '45deg' }], borderRadius: 4 },
  ripple: { position: 'absolute', left: 0, top: 0, width: 44, height: 44, borderWidth: 2, borderRadius: 22, borderColor: '#FFFFFF' },
});
