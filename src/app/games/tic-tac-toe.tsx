import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AppLayout } from '@/components/AppLayout';
import { useGameTheme as useTheme, GameBack, GameHero, ModeCards, StartButton, useGameUI } from '@/features/games/GameUI';
import Feather from '@expo/vector-icons/Feather';

const calculateWinner = (squares: any[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

const getBestMove = (squares: any[], player: string) => {
  const opp = player === 'X' ? 'O' : 'X';
  
  const minimax = (board: any[], depth: number, isMaximizing: boolean) => {
    const win = calculateWinner(board);
    if (win === player) return 10 - depth;
    if (win === opp) return depth - 10;
    if (board.every(Boolean)) return 0;
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = player;
          let score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = opp;
          let score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };
  
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      squares[i] = player;
      let score = minimax(squares, 0, false);
      squares[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
};

export default function TicTacToeScreen() {
  const theme = useTheme();
  const ui = useGameUI();
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'computer' | 'local'>('computer');
  const [mode, setMode] = useState<'pve' | 'pvp' | null>(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  useEffect(() => {
    if (mode === 'pve' && !xIsNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const move = getBestMove([...board], 'O');
        if (move !== -1) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          setBoard(newBoard);
          setXIsNext(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, mode, board, winner, isDraw]);

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
    <GameBack onPress={() => router.replace('/games')} />
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={ui.screen}>
        {!mode ? <>
          <GameHero kind="tic" title="TIC TAC TOE" subtitle="Three in a row. One winner." />
          <Text style={[ui.info, { textAlign: 'center' }]}>The classic game of X and O. Make your move.</Text>
          <Text style={ui.heading}>Select Mode</Text>
          <ModeCards value={selectedMode} onChange={setSelectedMode} color={theme.accent} />
          <Text style={[ui.info, { marginVertical: 22 }]}>{selectedMode === 'computer' ? 'You play X. Think ahead to outsmart the computer.' : 'Take turns on the same phone. Player X goes first.'}</Text>
          <StartButton color={theme.accent} onPress={() => setMode(selectedMode === 'computer' ? 'pve' : 'pvp')} />
        </> : <>
          <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', textAlign: 'center', marginVertical: 24 }}>TIC <Text style={{ color: theme.accent }}>TAC TOE</Text></Text>
          <Text accessibilityLiveRegion="polite" style={{ color: winner ? theme.accent : theme.textSecondary, textAlign: 'center', fontSize: 18, marginBottom: 24 }}>{winner ? `Winner: ${winner}` : isDraw ? "It's a draw!" : `Next player: ${xIsNext ? 'X' : 'O'}`}</Text>
          <View style={{ width: '100%', maxWidth: 360, aspectRatio: 1, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: theme.border, gap: '2%', padding: '2%', borderRadius: 18 }}>
            {board.map((cell, index) => <TouchableOpacity key={index} accessibilityRole="button" accessibilityLabel={`Square ${index + 1}, ${cell || 'empty'}`} disabled={!!cell || !!winner || isDraw || (mode === 'pve' && !xIsNext)} onPress={() => handlePress(index)} style={{ width: '32%', height: '32%', backgroundColor: theme.backgroundElement, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}><Text style={{ color: cell === 'X' ? theme.text : theme.accent, fontSize: 56, fontWeight: '600' }}>{cell}</Text></TouchableOpacity>)}
          </View>
          <StartButton title="Restart" color={theme.accent} onPress={resetGame} />
          <TouchableOpacity accessibilityRole="button" onPress={quitGame} style={{ minHeight: 48, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Feather name="sliders" color={theme.textSecondary} size={18} /><Text style={{ color: theme.textSecondary }}>Change Mode</Text></TouchableOpacity>
        </>}
      </View>
    </ScrollView>
  </AppLayout>;
}
