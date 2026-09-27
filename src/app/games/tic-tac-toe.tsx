import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppLayout } from '@/components/AppLayout';
import { useGameTheme as useTheme } from '@/features/games/GameUI';
import Feather from '@expo/vector-icons/Feather';
import { calculateWinner, getWinningLine, chooseComputerMove, levels, type Cell, type Difficulty } from '@/features/ticTacToe/ai';

import { WinningLine } from '@/features/ticTacToe/WinningLine';

export default function TicTacToeScreen() {
  const theme = useTheme();
  const [space, setSpace] = useState({ width: 0, height: 0 });
  const [boardSpace, setBoardSpace] = useState({ width: 0, height: 0 });
  const size = Math.max(0, Math.min(360, boardSpace.width, boardSpace.height));
  const compactRow = space.width >= 500 && space.height < 340;
  const [selectedMode, setSelectedMode] = useState<'computer' | 'local'>('computer');
  const [difficulty, setDifficulty] = useState<Difficulty>('basic');
  const [mode, setMode] = useState<'pve' | 'pvp' | null>(null);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const [centers, setCenters] = useState<Record<number, { x: number; y: number }>>({});
  const winningLine = getWinningLine(board);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  useEffect(() => {
    if (mode === 'pve' && !xIsNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const move = chooseComputerMove(board, difficulty);
        if (move !== -1) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          setBoard(newBoard);
          setXIsNext(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, mode, board, winner, isDraw, difficulty]);

  const handlePress = (index: number) => {
    if (board[index] || winner) return;
    if (mode === 'pve' && !xIsNext) return; // wait for computer
    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  const quitGame = () => {
    setMode(null);
    resetGame();
  };

  return <AppLayout themeOverride={theme} mobileTitle="Tic Tac Toe" scrollable={false}>
    <View testID="tic-content" onLayout={event => setSpace(event.nativeEvent.layout)} style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 12, paddingBottom: 8, gap: 8 }}>
        {!mode ? <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>TIC TAC TOE</Text>
          <View style={{ flexDirection: compactRow ? 'row' : 'column', gap: 12 }}>
            <View style={{ gap: 6, flex: compactRow ? 1 : undefined }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Mode</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['computer', 'local'] as const).map(value => <TouchableOpacity key={value} accessibilityRole="radio" accessibilityLabel={value === 'computer' ? 'Vs Computer' : '2 Players'} accessibilityState={{ checked: selectedMode === value }} onPress={() => setSelectedMode(value)} style={{ flex: 1, minHeight: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: selectedMode === value ? theme.accentMuted : theme.backgroundElement, borderWidth: 1, borderColor: selectedMode === value ? theme.accent : theme.border }}><Text style={{ color: theme.text, fontWeight: '700' }}>{value === 'computer' ? 'Vs Computer' : '2 Players'}</Text></TouchableOpacity>)}
              </View>
            </View>
            {selectedMode === 'computer' && <View style={{ gap: 6, flex: compactRow ? 1 : undefined }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Difficulty</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(Object.keys(levels) as Difficulty[]).map(level => <TouchableOpacity key={level} accessibilityRole="button" accessibilityLabel={`${levels[level].label} difficulty`} accessibilityState={{ selected: difficulty === level }} onPress={() => setDifficulty(level)} style={{ flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: difficulty === level ? theme.accent : theme.border, backgroundColor: difficulty === level ? theme.accentMuted : theme.backgroundElement }}><Text style={{ color: theme.text, fontWeight: '700' }}>{levels[level].label}</Text></TouchableOpacity>)}
              </View>
            </View>}
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={() => setMode(selectedMode === 'computer' ? 'pve' : 'pvp')} style={{ minHeight: 44, borderRadius: 12, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: theme.background, fontWeight: '800', fontSize: 16 }}>Start Game</Text></TouchableOpacity>
        </View> : <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{mode === 'pve' ? `Computer · ${levels[difficulty].label}` : '2 Players'}</Text>
            <Text accessibilityLiveRegion="polite" style={{ color: winner ? theme.accent : theme.text, fontSize: 16, fontWeight: '700' }}>{winner ? `Winner: ${winner}` : isDraw ? "It's a draw!" : `Next: ${xIsNext ? 'X' : 'O'}`}</Text>
          </View>
          <View testID="tic-board-space" onLayout={event => setBoardSpace(event.nativeEvent.layout)} style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: size, height: size, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: theme.border, gap: size * 0.018, padding: size * 0.02, borderRadius: 18 }}>
            {board.map((cell, index) => <TouchableOpacity key={index} onLayout={({ nativeEvent: { layout } }) => {
              const center = { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 };
              setCenters(previous => previous[index]?.x === center.x && previous[index]?.y === center.y ? previous : { ...previous, [index]: center });
            }} accessibilityRole="button" accessibilityLabel={`Square ${index + 1}, ${cell || 'empty'}`} disabled={!!cell || !!winner || isDraw || (mode === 'pve' && !xIsNext)} onPress={() => handlePress(index)} style={{ width: size * 0.308, height: size * 0.308, backgroundColor: theme.backgroundElement, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}><Text style={{ color: cell === 'X' ? theme.text : theme.accent, fontSize: Math.min(56, size * 0.17), fontWeight: '600' }}>{cell}</Text></TouchableOpacity>)}
            {winningLine && centers[winningLine[0]] && centers[winningLine[2]] && <WinningLine
              key={winningLine.join('-')}
              start={centers[winningLine[0]]}
              end={centers[winningLine[2]]}
              color={winner === 'X' ? theme.text : theme.accent}
            />}
          </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity accessibilityRole="button" onPress={resetGame} style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.background, fontWeight: '700' }}>Restart</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={quitGame} style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: theme.backgroundElement, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Feather name="sliders" color={theme.textSecondary} size={16} /><Text style={{ color: theme.textSecondary }}>Change Mode</Text></TouchableOpacity>
          </View>
        </>}
    </View>
  </AppLayout>;
}
