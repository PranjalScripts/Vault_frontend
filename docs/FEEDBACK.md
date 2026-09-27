# Shared action feedback

`FeedbackModalProvider` is mounted in the root layout. Use `useFeedbackModal()` for successful mutations, errors and promise-based confirmation:

```tsx
const { showSuccess, showError, confirm } = useFeedbackModal();

async function remove() {
  if (!(await confirm({ title: "Delete Task?", message: "Are you sure you want to delete this task? This action cannot be undone." }))) return;
  try {
    await deleteTask();
    showSuccess({ title: "Task Deleted", message: "The task has been deleted successfully." });
  } catch {
    showError({ title: "Unable to delete task", message: "Please try again." });
  }
}
```

The queue keeps feedback from concurrent actions from overwriting an open dialog. Confirmation resolves after dismissal, defaults to cancellation, and ignores repeated presses. The To-Do screen also guards against duplicate delete requests. Existing confirmations that already own busy/error state use the same `ConfirmModal` component directly.

`SuccessModal`, `ErrorModal` and `ConfirmModal` share `FeedbackDialog`, using Vault's existing theme colors, 24px modal corners/padding, 14px body text, 21px headings and 44px buttons. Dialogs are capped at 420px, respect safe areas, scroll on small screens and animate open/close with reduced-motion support. Web dialogs support Escape, focus restoration and keyboard focus containment; destructive dialogs initially focus Cancel. Clicking the backdrop never confirms a destructive action.

Existing native form modals mount `FeedbackModalHost` inside their Modal. This displays errors above the form without stacking native modal presentations, preserves draft inputs, and lets Android Back dismiss feedback before the form. Existing inline field-validation errors remain inline. When an action closes its form, the provider allows its closing transition to finish before showing success.

Covered actions:

- Tasks: create, edit, complete/reopen, delete; dashboard task completion and the legacy bulk-task action hook.
- Subjects/topics: create, edit, status changes, delete, and importing shared content.
- Passcodes/vault: create, edit, delete, vault setup, password change and completed recovery.
- Trash: restore, permanently delete one item and empty Trash.
- Settings: persisted appearance and reminder preferences.
- Existing native/browser alerts are replaced with shared error/info feedback. Existing form validation remains separate from success.

Search, sorting, filtering, pagination, navigation, opening menus, password visibility and vault unlocking do not produce success dialogs. Clipboard copying retains its existing lightweight toast/check feedback; copy errors use the shared error dialog. No bookmark CRUD screen/API exists in this checkout; future bookmark actions can use the same hook.

Success is emitted after the mutation succeeds, never from `finally` or a failed mutation. A subsequent list-refresh failure can separately report a load error. No API routes, encryption operations, navigation destinations, pagination or filter rules were changed. The requested task confirmation text says the action cannot be undone; the existing backend's Trash/restore semantics are preserved.

## Verification

- Web export succeeded.
- Browser tests with mocked API responses passed for desktop/mobile sizes in light/dark themes: confirmation opens without deleting, Cancel/Escape make no delete request, failed delete/save never show success, successful delete/create/complete/reopen show the correct dialog, failed form saves preserve drafts, and search produces no feedback. Screenshots were visually checked.
- ESLint has no errors and only the four warnings present before this change.
- TypeScript reports the same two pre-existing errors: the `/explore` route in `app-tabs.web.tsx` and the `turns` comparison in `features/path/engine/variations.ts`.
- The existing Node regression suite passed 103/104 tests. The failing Path stroke-preview cancellation test is unrelated to feedback changes.
- Native iOS/Android presentation was implemented using React Native Modal/Animated and existing form hosts, but was not exercised on a simulator/device in this session.

The optional browser script is `tests/feedback.web.cjs`. It uses Playwright from `PLAYWRIGHT_MODULE` (or an existing installation) without adding a runtime dependency. Export with `EXPO_PUBLIC_API_URL=http://127.0.0.1:19099/api`, serve that export locally, then run:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright \
CHROME_PATH=/path/to/chrome \
FEEDBACK_TEST_URL=http://127.0.0.1:19098 \
node tests/feedback.web.cjs
```

The script intercepts all requests to the local mock API and uses synthetic authentication data. Set `FEEDBACK_ARTIFACT_DIR` to an existing directory for screenshots and `FEEDBACK_TEST_CASES=mobile` to run only mobile sizes. Never point this test at the production API.
