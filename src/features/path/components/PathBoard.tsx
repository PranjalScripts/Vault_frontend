import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { PathStroke } from '../engine/stroke';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import { PathPuzzle, indexOf } from '../engine/types';
import Svg, { Path } from 'react-native-svg';
import { strokePath } from '../engine/visualStroke';
import type { StrokePoint } from '../engine/stroke';
const AnimatedPath = Animated.createAnimatedComponent(Path);
type Props = { size: number; puzzle: PathPuzzle; path: number[]; hint: number | null; invalid: number | null; disabled: boolean; onEnterCells: (cells: number[]) => void };
export function PathBoard(props: Props) {
  const theme = useTheme(), width = props.size;
  const latest = useRef(props); latest.current = props;
  const boardWidth = useRef(0), stroke = useRef(new PathStroke());
  boardWidth.current = Math.max(0, width - 2);
  const { puzzle, path } = props, cellSize = Math.max(0, width - 2) / puzzle.cols;
  // One atomic snapshot prevents a new tail being paired with an older route.
  // Pointer samples update animated SVG props, never React board state.
  const visual = useSharedValue<{ cells: readonly number[]; finger: StrokePoint | null; cols: number; cellSize: number }>({ cells: path, finger: null, cols: puzzle.cols, cellSize });
  const animatedProps = useAnimatedProps(() => ({ d: strokePath(visual.value.cells, visual.value.cols, visual.value.cellSize, visual.value.finger) }));
  const finish = useCallback(() => {
    if (stroke.current.active) {
      visual.value = { ...visual.value, cells: [...stroke.current.confirmedPath], finger: null };
    }
    stroke.current.end();
  }, [visual]);
  const updatePreview = useCallback((point: StrokePoint) => {
    if (!stroke.current.active) return;
    const segment = stroke.current.preview(point);
    visual.value = { cells: [...stroke.current.confirmedPath], finger: segment?.to ?? null,
      cols: latest.current.puzzle.cols, cellSize: boardWidth.current / latest.current.puzzle.cols };
  }, [visual]);
  const gesture = useMemo(() => {
    // The bounded page has no scroll handler competing with the board gesture.
    const pan = Gesture.Pan().minDistance(0).maxPointers(1).shouldCancelWhenOutside(false)
      .runOnJS(true);
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
      const point = localPoint(event);
      const cells = stroke.current.begin(current.puzzle, current.path, point, boardWidth.current);
      if (cells.length) current.onEnterCells(cells);
      updatePreview(point);
    }).onUpdate(update).onEnd(update).onFinalize(finish);
  }, [finish, updatePreview]);
  useLayoutEffect(() => { finish(); return finish; }, [puzzle.id, props.disabled, width, finish]);
  useLayoutEffect(() => {
    // Undo/replay/restored games use the same overlay when no drag is active.
    if (!stroke.current.active || !path.length) {
      stroke.current.end();
      visual.value = { cells: path, finger: null, cols: puzzle.cols, cellSize };
    }
  }, [path, puzzle.id, puzzle.cols, cellSize, props.disabled, visual]);
  const checkpoints = new Map(puzzle.checkpoints.map(c => [indexOf(c.position, puzzle.cols), c.number]));
  const blocked = new Set(puzzle.blockedCells.map(c => indexOf(c, puzzle.cols))), visited = new Set(path);
  const thickness = Math.max(7, cellSize * .2);
  return <GestureDetector gesture={gesture} touchAction="none" userSelect="none"><View testID="path-board"
    style={[styles.board, { aspectRatio: puzzle.cols / puzzle.rows, backgroundColor: theme.backgroundElement, borderColor: theme.border }, Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none' } : {}]}>
    {Array.from({ length: puzzle.rows * puzzle.cols }, (_, cell) => {
      const number = checkpoints.get(cell), isBlocked = blocked.has(cell);
      return <View key={cell} accessible accessibilityRole="button" accessibilityState={{ disabled: props.disabled || isBlocked }}
        accessibilityActions={isBlocked ? [] : [{ name: 'activate', label: 'Move here' }]}
        onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'activate' && !props.disabled && !isBlocked) props.onEnterCells([cell]); }}
        accessibilityLabel={`Row ${Math.floor(cell / puzzle.cols) + 1}, column ${cell % puzzle.cols + 1}${number ? `, checkpoint ${number}` : ''}${isBlocked ? ', blocked' : ''}${visited.has(cell) ? ', visited' : ''}`}
        style={{ position: 'absolute', left: cell % puzzle.cols * cellSize, top: Math.floor(cell / puzzle.cols) * cellSize, width: cellSize, height: cellSize, borderWidth: .5, borderColor: theme.border,
          backgroundColor: isBlocked ? theme.backgroundSelected : props.invalid === cell ? `${theme.danger}25` : props.hint === cell ? theme.accentMuted : 'transparent' }}>
        {isBlocked && <Text style={{ color: theme.textSecondary, textAlign: 'center', lineHeight: cellSize, fontSize: 20 }}>×</Text>}
      </View>;
    })}
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg pointerEvents="none" width={cellSize * puzzle.cols} height={cellSize * puzzle.rows} style={StyleSheet.absoluteFill}>
        <AnimatedPath testID="path-continuous-stroke" animatedProps={animatedProps} fill="none"
          stroke={theme.accent} strokeWidth={thickness} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      {Array.from(checkpoints).map(([cell, number]) => <View key={cell} style={{ position: 'absolute', left: (cell % puzzle.cols + .5) * cellSize - cellSize * .3, top: (Math.floor(cell / puzzle.cols) + .5) * cellSize - cellSize * .3, width: cellSize * .6, height: cellSize * .6, borderRadius: cellSize, backgroundColor: visited.has(cell) ? theme.accent : theme.backgroundElement, borderWidth: 2, borderColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: visited.has(cell) ? theme.background : theme.text, fontWeight: '800', fontSize: Math.max(8, cellSize * .27) }}>{number}</Text>
      </View>)}
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
