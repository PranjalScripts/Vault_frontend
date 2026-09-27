import { puzzles } from '@/features/puzzles/puzzles';

export { default } from '@/features/puzzles/PuzzleScreen';

// Register every public question URL for direct links in the static web build.
// Answers are fetched separately through the authenticated API.
export function generateStaticParams() {
  return puzzles.map(({ id }) => ({ id }));
}
