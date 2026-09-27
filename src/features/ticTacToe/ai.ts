export type Cell = 'X' | 'O' | null;
export type Difficulty = 'basic' | 'medium' | 'hard';
export const levels = {
  basic: { label: 'Basic', description: 'A relaxed opponent that often misses opportunities.', mistakeRate: 0.65 },
  medium: { label: 'Medium', description: 'Smarter play, with occasional mistakes.', mistakeRate: 0.25 },
  hard: { label: 'Hard', description: 'Strong play, with rare mistakes. Still beatable.', mistakeRate: 0.05 },
} as const;

export const getWinningLine = (squares: readonly Cell[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return lines[i];
    }
  }
  return null;
};

export const calculateWinner = (squares: readonly Cell[]) => {
  const line = getWinningLine(squares);
  return line ? squares[line[0]] : null;
};

export const chooseComputerMove = (squares: readonly Cell[], difficulty: Difficulty, random = Math.random) => {
  if (calculateWinner(squares) || squares.every(Boolean)) return -1;
  const boardCopy = [...squares];
  const player = 'O';
  const opp = 'X';
  
  const minimax = (board: Cell[], depth: number, isMaximizing: boolean) => {
    const win = calculateWinner(board);
    if (win === player) return 10 - depth;
    if (win === opp) return depth - 10;
    if (board.every(Boolean)) return 0;
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = player;
          const score = minimax(board, depth + 1, false);
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
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };
  
  const candidates: { move: number; score: number }[] = [];
  for (let i = 0; i < 9; i++) {
    if (!boardCopy[i]) {
      boardCopy[i] = player;
      candidates.push({ move: i, score: minimax(boardCopy, 0, false) });
      boardCopy[i] = null;
    }
  }
  const bestScore = Math.max(...candidates.map(candidate => candidate.score));
  const best = candidates.filter(candidate => candidate.score === bestScore);
  const mistakes = candidates.filter(candidate => candidate.score < bestScore);
  // Deliberately choose a weaker legal move sometimes, including missed blocks.
  // Hard remains beatable; no level changes the player's moves or the rules.
  const pool = mistakes.length && random() < levels[difficulty].mistakeRate ? mistakes : best;
  return pool[Math.floor(random() * pool.length)].move;
};
