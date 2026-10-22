# Interview Prep UI

`src/features/interview` contains shared catalog/progress components, the question browser, types and a focus-aware loader. Four Expo routes consume the existing authenticated Axios client through `src/api/interview.ts`. The module is registered in the existing sidebar/mobile menu and protected route list.

Subjects and topics come from the API. No Java-specific screens or question content are embedded in the frontend. Planned counts are labeled separately from available questions. The reusable JSON importer and backend API contract are documented in `Backend/INTERVIEW.md`.

The MCQ catalog exposes each Java category as its own topic, so each category has an independent progress summary and question numbering starts at Q1 within that category. Numbers shown in lists and question details are derived from the topic's stable order to avoid gaps from older stored values. The Java source contains 411 questions; stable source IDs are retained by the importer so existing answers and progress remain attached to their questions.

Search is debounced, filter changes reset pagination, and outdated responses are ignored. Screens reload on focus and disable the shared GET cache so progress refreshes when returning from a question or another device. Continue uses server-persisted last-opened progress. Opening a question saves reading position without success feedback; meaningful progress changes use the existing global success/error modal provider, only after the API completes. Failed saves preserve the displayed progress and support retry. Search/navigation/filtering never show success modals.

Layout uses Vault's theme, AppLayout, buttons and panels; mobile cards stack with side gutters. Optional answer sections are omitted when absent. Previous/Next are disabled at subject boundaries. Revised state can be reversed, with revision history retained.

## Browser checks

Export with a local fixture API URL:

```sh
EXPO_PUBLIC_API_URL=http://127.0.0.1:19099/api npx expo export --platform web --output-dir /tmp/vault-interview-web
```

Serve the export with dynamic-route fallback support (e.g. `/interview/java` maps to `interview/[subject].html`, question IDs to `interview/question/[id].html`, and topic paths to `interview/[subject]/[topic].html`). Then:

```sh
INTERVIEW_TEST_URL=http://127.0.0.1:19097 \
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright \
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
INTERVIEW_ARTIFACT_DIR=/tmp/vault-interview-artifacts \
node tests/interview.web.cjs
```

All API requests in this check are fixtures. It covers empty states, dynamic topic routes, search/filters, revision/important saves, error feedback, optional content, Continue, retry and no browser alerts, on desktop/mobile in both themes. Synthetic fixtures are confined to tests. The importer seeds the reviewed source JSON.

Answers, examples and tips render fenced code, bold and inline code with preserved line breaks. Code scrolls inside themed panels; HTML is never executed.

`tests/interview.import.web.cjs` uses the actual imported JSON as browser fixtures to verify the 170-question catalog, all nine topics, Markdown/code rendering and navigation at 1280px and 390px in both themes. Run with the same browser environment as `interview.web.cjs`.
