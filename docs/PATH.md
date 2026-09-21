# Path

Path is an original local Vault puzzle game at `/games/path`, reached through Games in the sidebar or mobile drawer. It uses Vault's authenticated routing, AppLayout and theme. No backend endpoints or new dependencies are introduced.

## Engine

`src/features/path/engine` contains pure TypeScript generation, solving, movement validation, difficulty, seeded randomness, daily seeds and symmetry fingerprints. UI and storage do not participate in generation.

Generator version 2 constructs a covering path, mixes its geometry using endpoint backbite transformations, and selects higher-turn paths for Turn Challenge/Mixed. Blocked variants trim both ends of that path; the remaining cells therefore have a known covering path. Wall variants add only edges not traversed by that solution.

Version 2 always places the final checkpoint at the solution endpoint and rejects entry into it until every other usable cell is filled. Version 1 seed reproduction remains available through `generatorVersion: 1`; saved version 1 puzzles retain their original rules.

Generation starts with numbered guidance along the solution and removes clues in seeded order. Each removal must pass a complete uniqueness proof; failed or budget-exhausted removals are restored. Final puzzles are certified again. There are no generated fixture collections or random-number placement assumptions.

Difficulty profiles use 5×5, 6×6, 7×7 and 8×8 boards, decreasing target clue densities and increasing minimum turn ratios. Sparse lowers the clue target further. The score combines board area, clue density, turn density, branching/search effort, walls and blockers. Score bands are Easy <45, Medium <68, Hard <94, Expert ≥94. A candidate must match its requested score band. These are initial algorithmic estimates, not claims of measured human solving difficulty.

`solvePuzzle(puzzle, maxSolutions = 2, maxNodes = 120000)` returns count, exhausted, nodes, branches, forced moves and its first solution. It never reads `puzzle.solution`. A result with `exhausted: true` does not prove uniqueness even if count is one. Generation uses 16,000 nodes per proof and at most 12 candidates by default. These deterministic limits are configurable through GenerateOptions. Search uses DFS, a compact visited array, residual connectivity/degree pruning, ordered checkpoints, forced single candidates and degree-based candidate ordering.

`generatePuzzle` cooperatively schedules resumable generation/search in approximately 6ms slices. Search yields every 128 nodes and path mixing every 32 steps. A 15-second outer deadline aborts with an error; it does not accept a different candidate based on device speed. Cancel/navigation also aborts. `generatePuzzleSync` is for engine tests and offline tooling, not UI handlers.

## Reproduction and daily puzzles

Save seed, generatorVersion, difficulty and resolved variation. Random uses a separate deterministic variation choice, so these saved values reproduce the same board with the matching generator implementation. Future algorithm changes must increment the version and retain old implementations if seed replay is needed. Saved games also store their full original board.

Daily seeds use UTC: `path-daily-YYYY-MM-DD-DIFFICULTY-v2`, with Classic rules. The new-puzzle selector offers today's Daily. Daily generation ignores personal anti-repeat history. Ordinary generation retries fresh seeds when a canonical fingerprint occurs in the last 100 boards. Fingerprints normalize rotations and reflections of dimensions, numbered clues, blockers and walls; they do not depend on the hidden solution.

The canonical solution is local and powers hints. A hint reveals one next cell for a matching prefix, or the cell to backtrack to if the player has deviated. A future competitive API must omit the solution from its public payload and perform verification server-side.

## Interaction and state

The board uses a single React Native Gesture Handler pan gesture for mouse/touch, with board-local coordinates and no competing cell press handlers. Drag starts at checkpoint 1 or the current endpoint; release and resume, backward undo and accessible individual cell activation are supported. Skipped pointer samples traverse the cells intersected by the pointer segment, with every cell validated. Exact diagonal corner crossings are rejected. A gesture owns its current path independently of React renders and batches traversed cells into one state update. Wall and blocked-cell rules are checked on every move.

The timer starts on the first valid placement, uses monotonic elapsed intervals and pauses on route blur, native backgrounding and browser visibility changes. Display refreshes are independent of elapsed accounting. Undo preserves elapsed time; Restart/Replay begins a new attempt.

Per-user versioned snapshots contain puzzle, path, elapsed time, counters, preferences, recent fingerprints and stats. Web uses synchronous localStorage, including pagehide. Native reuses Vault's chunked two-bank SecureStore snapshot utility with serialized writes. Move writes are coalesced for 200ms; elapsed checkpoints save every five seconds and on lifecycle boundaries. Abrupt OS termination can lose the unsaved interval. Corrupt/unsupported snapshots recover to an empty state.

Games played counts created attempts, including restarts/replays. Solved games are deduplicated by attempt ID. Best/average times include hinted solves. Hints used counts all hint requests. Streak means consecutive UTC days with a completion, and expires after a missed day. Stats and storage adapters are isolated for future synchronization.

## Validation

- `npm run test:path`: 480 generated boards across every difficulty/variation, reproducibility, full valid solutions, independent uniqueness checks, incremental rules/undo, score classification, corrupt snapshots, counters, hints, daily UTC seeds, symmetry, asynchronous yielding/cancellation and timer accounting.
- `node --test tests/*.test.cjs`: full frontend suite.
- `npx tsc --noEmit` and `npm run lint`.
- `npx expo export --platform web --output-dir /tmp/vault-path-web`.
- `npx expo export --platform android --output-dir /tmp/vault-path-android`.
- Backend regression suite: `node --test tests/*.test.js` from Backend.

A pre-existing TypeScript error in unused `src/components/app-tabs.web.tsx` points to `/explore`, which does not exist. Lint has pre-existing unused-variable warnings in dashboard, WhatsApp and passcode details. These unrelated files were not changed.

Web and Android exports have succeeded. Desktop board/completion rendering and a 360px selector were inspected in Chrome. On-device drag, lifecycle, light/dark and accessibility acceptance checks remain necessary before release.
