export const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;
export const variations = ['classic', 'walls', 'blocked', 'sparse', 'turns', 'mixed'] as const;
export type Difficulty = typeof difficulties[number];
export type Variation = typeof variations[number];
export type Position = { row: number; col: number };
export type PathPuzzle = {
  id: string; seed: string; generatorVersion: number; rows: number; cols: number;
  difficulty: Difficulty; variation: Variation;
  checkpoints: { number: number; position: Position }[];
  blockedCells: Position[]; walls: { from: Position; to: Position }[];
  solution: Position[]; difficultyScore: number;
  finishAtLastCheckpoint?: boolean;
};
export const indexOf = (p: Position, cols: number) => p.row * cols + p.col;
export const positionOf = (i: number, cols: number): Position => ({ row: Math.floor(i / cols), col: i % cols });
