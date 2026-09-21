import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { PathStroke } from '../engine/stroke';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { PathPuzzle, indexOf } from '../engine/types';
import { PathSegment } from './PathSegment';
type Props = { scrollGesture: ReturnType<typeof Gesture.Native>; onDrawingChange: (active: boolean) => void; puzzle: PathPuzzle; path: number[]; hint: number | null; invalid: number | null; disabled: boolean; onEnterCells: (cells: number[]) => void };
export function PathBoard(props: Props) {
  const theme = useTheme(), [width, setWidth] = useState(0);
  const latest = useRef(props); latest.current = props;
  const boardWidth = useRef(0), stroke = useRef(new PathStroke());
  const { puzzle, path } = props, cellSize = Math.max(0, width - 2) / puzzle.cols;
  const preview = useSharedValue({ x: 0, y: 0, length: 0, angle: 0, visible: false });
  const previewStyle = useAnimatedStyle(() => ({
    left: preview.value.x, top: preview.value.y, width: preview.value.length,
    opacity: preview.value.visible ? 1 : 0,
    transform: [{ rotate: `${preview.value.angle}rad` }],
  }));
  const finish = useCallback(() => {
    stroke.current.end();
    preview.value = { ...preview.value, visible: false };
    latest.current.onDrawingChange(false);
  }, [preview]);
  const updatePreview = useCallback((point: { x: number; y: number }) => {
    const segment = stroke.current.preview(point);
    if (!segment) { preview.value = { ...preview.value, visible: false }; return; }
    const dx = segment.to.x - segment.from.x, dy = segment.to.y - segment.from.y;
    const length = Math.hypot(dx, dy), thickness = Math.max(7, boardWidth.current / latest.current.puzzle.cols * .2);
    preview.value = { x: (segment.from.x + segment.to.x) / 2 - length / 2,
      y: (segment.from.y + segment.to.y) / 2 - thickness / 2,
      length, angle: Math.atan2(dy, dx), visible: true };
  }, [preview]);
  const gesture = useMemo(() => {
    // The native scroll handler must wait for the board, even before JS toggles scrollEnabled.
    const pan = Gesture.Pan().minDistance(0).maxPointers(1).shouldCancelWhenOutside(false)
      .blocksExternalGesture(props.scrollGesture).runOnJS(true);
    const localPoint = (event: { x: number; y: number }) => {
      const w = boardWidth.current, h = w * latest.current.puzzle.rows / latest.current.puzzle.cols;
      // Include the one-pixel outer border in the edge cells; real departures still suspend drawing.
      const clampBorder = (n: number, size: number) => n >= -1 && n <= size + 1 ? Math.max(0, Math.min(size - .001, n)) : n;
      return { x: clampBorder(event.x - 1, w), y: clampBorder(event.y - 1, h) };
    };
    const update = (event: { x: number; y: number }) => {
      if (latest.current.disabled) { finish(); return; }
      const point = localPoint(event), cells = stroke.current.update(point);
      if (cells.length) latest.current.onEnterCells(cells);
      updatePreview(point);
    };
    return pan.onBegin(event => {
      const current = latest.current;
      if (current.disabled) return;
      current.onDrawingChange(true);
      const point = localPoint(event);
      const cells = stroke.current.begin(current.puzzle, current.path, point, boardWidth.current);
      if (cells.length) current.onEnterCells(cells);
      updatePreview(point);
    }).onUpdate(update).onEnd(update).onFinalize(finish);
  }, [props.scrollGesture, finish, updatePreview]);
  useEffect(() => { finish(); return finish; }, [puzzle.id, props.disabled, finish]);
  const checkpoints = new Map(puzzle.checkpoints.map(c => [indexOf(c.position, puzzle.cols), c.number]));
  const blocked = new Set(puzzle.blockedCells.map(c => indexOf(c, puzzle.cols))), visited = new Set(path);
  const thickness = Math.max(7, cellSize * .2);
  return <GestureDetector gesture={gesture} touchAction="none" userSelect="none"><View testID="path-board" onLayout={e => { const next = Math.max(0, e.nativeEvent.layout.width - 2); if (next !== boardWidth.current) { finish(); boardWidth.current = next; setWidth(e.nativeEvent.layout.width); } }}
    style={[styles.board, { aspectRatio: puzzle.cols / puzzle.rows, backgroundColor: theme.backgroundElement, borderColor: theme.border }, Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none' } : {}]}>
    {Array.from({ length: puzzle.rows * puzzle.cols }, (_, cell) => {
      const number = checkpoints.get(cell), isBlocked = blocked.has(cell);
      return <View key={cell} accessible accessibilityRole="button" accessibilityState={{ disabled: props.disabled || isBlocked }}
        accessibilityActions={isBlocked ? [] : [{ name: 'activate', label: 'Move here' }]}
        onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'activate' && !props.disabled && !isBlocked) props.onEnterCells([cell]); }}
        accessibilityLabel={`Row ${Math.floor(cell / puzzle.cols) + 1}, column ${cell % puzzle.cols + 1}${number ? `, checkpoint ${number}` : ''}${isBlocked ? ', blocked' : ''}${visited.has(cell) ? ', visited' : ''}`}
        style={{ position: 'absolute', left: cell % puzzle.cols * cellSize, top: Math.floor(cell / puzzle.cols) * cellSize, width: cellSize, height: cellSize, borderWidth: .5, borderColor: theme.border,
          backgroundColor: isBlocked ? theme.backgroundSelected : props.invalid === cell ? `${theme.danger}25` : props.hint === cell ? theme.accentMuted : visited.has(cell) ? `${theme.accent}14` : 'transparent' }}>
        {isBlocked && <Text style={{ color: theme.textSecondary, textAlign: 'center', lineHeight: cellSize, fontSize: 20 }}>×</Text>}
      </View>;
    })}
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {path.slice(1).map((cell, i) => {
        const prev = path[i], x = (cell % puzzle.cols + .5) * cellSize, y = (Math.floor(cell / puzzle.cols) + .5) * cellSize;
        const px = (prev % puzzle.cols + .5) * cellSize, py = (Math.floor(prev / puzzle.cols) + .5) * cellSize;
        return <PathSegment key={`${prev}-${cell}`} style={{ position: 'absolute', left: Math.min(x, px) - thickness / 2, top: Math.min(y, py) - thickness / 2, width: Math.abs(x - px) + thickness, height: Math.abs(y - py) + thickness, backgroundColor: theme.accent, borderRadius: thickness }} />;
      })}
      <Animated.View style={[{ position: 'absolute', height: thickness, borderRadius: thickness, backgroundColor: theme.accent }, previewStyle]} />
      {Array.from(checkpoints).map(([cell, number]) => <View key={cell} style={{ position: 'absolute', left: (cell % puzzle.cols + .5) * cellSize - cellSize * .3, top: (Math.floor(cell / puzzle.cols) + .5) * cellSize - cellSize * .3, width: cellSize * .6, height: cellSize * .6, borderRadius: cellSize, backgroundColor: visited.has(cell) ? theme.accent : theme.backgroundElement, borderWidth: 2, borderColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: visited.has(cell) ? theme.background : theme.text, fontWeight: '800', fontSize: Math.max(12, cellSize * .27) }}>{number}</Text>
      </View>)}
      {path.length > 0 && !checkpoints.has(path[path.length - 1]) && <View style={{ position: 'absolute', left: (path[path.length - 1] % puzzle.cols + .5) * cellSize - 6, top: (Math.floor(path[path.length - 1] / puzzle.cols) + .5) * cellSize - 6, width: 12, height: 12, borderRadius: 6, backgroundColor: theme.background, borderWidth: 3, borderColor: theme.accent }} />}
      {puzzle.walls.map((wall, i) => {
        const vertical = wall.from.row === wall.to.row;
        return <View key={i} style={{ position: 'absolute', backgroundColor: theme.text,
          left: vertical ? Math.max(wall.from.col, wall.to.col) * cellSize - 2 : wall.from.col * cellSize,
          top: vertical ? wall.from.row * cellSize : Math.max(wall.from.row, wall.to.row) * cellSize - 2,
          width: vertical ? 4 : cellSize, height: vertical ? cellSize : 4, borderRadius: 2 }} />;
      })}
      {props.hint !== null && <View style={{ position: 'absolute', left: props.hint % puzzle.cols * cellSize + 3, top: Math.floor(props.hint / puzzle.cols) * cellSize + 3, width: cellSize - 6, height: cellSize - 6, borderRadius: 8, borderWidth: 3, borderStyle: 'dashed', borderColor: theme.accent }} />}
    </View>
  </View></GestureDetector>;
}
const styles = StyleSheet.create({ board: { width: '100%', borderWidth: 1, borderRadius: 12, overflow: 'hidden' } });
