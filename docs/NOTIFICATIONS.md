# Local OS reminders

Vault uses `expo-notifications` to schedule notifications directly with iOS/Android. Delivery does not call Vault's backend, Expo Push, Firebase, or APNs. There are no push tokens, notification endpoints, or cron jobs.

## Behavior

- Enable **Settings → Reminders** on the phone and allow the OS notification permission.
- Settings shows the next reminder read from the OS queue, or explains why none is scheduled. Saving an enabled frequency refreshes pending tasks so an empty local cache does not silently leave reminders unscheduled. Selecting a frequency alone does not create a task or study session.
- Both reminder categories default to **3 hours**, with **1-minute** and **2-hour** options. Existing hour-based preferences migrate automatically. Reminders may arrive overnight.
- Task reminders never fire before their saved due time. The earliest due task anchors the cadence; other tasks join the first reminder slot at or after their due time. The existing date picker saves noon in the creating device's local timezone. Multiple due tasks are grouped into one reminder per interval.
- Opening an unfinished subject, opening topic resources, or marking a topic in progress saves study activity locally. Subject visits preserve the last unfinished topic in that subject, otherwise prefer an in-progress topic, then the first unfinished topic. Study reminders begin one full interval later; messages reflect hours or days since that interaction. After the first day, study nudges become daily. Returning to study resets the clock. Taps open the last topic's resource panel, not a video's exact playback timestamp.
- Successful task edits/completion/deletion and subject/topic changes update the local notification queue. Sign-out and account changes cancel it locally, without requiring internet. If native cleanup fails, sign-out still clears the session and logs that previously scheduled alerts may remain until cleanup succeeds.
- Preferences are per account in SecureStore; reminder task/activity snapshots are per account in small SecureStore chunks. Notification content may appear on the lock screen according to phone settings.

## Scheduling limits

Vault queues **up to 60 native notifications total** across tasks and study. Study scheduling reserves follow-ups around 3, 6 and 12 hours (aligned to the chosen interval), plus seven daily reminders. Remaining slots hold the nearest task and study reminders. This prevents a one-minute queue from crowding out later study follow-ups. One-minute frequent reminders cover roughly 25–60 minutes depending on enabled categories; reserved study follow-ups continue over the following days. The queue refills on app foreground, data changes and preference changes. Returning to the app after a longer absence can schedule another seven daily study reminders; the last topic is no longer discarded merely because a week passed.

Already scheduled notifications can arrive while Vault is closed or offline. OS battery settings, Focus modes, Android force-stop, and permissions can suppress or delay delivery. Vault does not request exact-alarm permission; the installed Expo Android scheduler falls back to inexact alarms where required.

Changes made on another device take effect on this phone after normal data synchronization. No server can cancel a phone's local queue while that phone remains offline. A full task refresh uses all pending-task pages and preserves the last complete snapshot if requests fail.

## Build and test

Rebuild/install the native app if the installed binary does not yet include `expo-notifications`. No Firebase configuration, Google services file, APNs key, or backend deployment is needed for these local reminders. The `expo-notifications` plugin is already in `app.json`.

Run `node --test tests/reminders.test.cjs` in Frontend. Tests mock OS notifications and storage; they send no real alerts.

On a phone:

1. Enable reminders and grant permission. Disable/re-enable each category and change the interval.
2. Set a task's due time a few minutes ahead in development, background Vault, and verify the OS alert and task navigation.
3. Complete/delete the task on this phone; verify its pending alerts disappear.
4. Open an unfinished topic resource, wait the selected interval, and verify the study alert opens the correct topic.
5. Schedule reminders, disconnect internet, and close the app. Verify delivery still occurs.
6. Sign out while offline and verify local alerts are canceled.
7. Verify web never prompts for notification permission.

Reference: https://docs.expo.dev/versions/v54.0.0/sdk/notifications/

## Native Android presentation

`patches/expo-notifications+0.32.17.patch` extends Expo's native notification builder with SupSend-inspired compact, expanded and heads-up `RemoteViews`. `DecoratedCustomViewStyle` keeps Android's app identity, timestamp, expand and dismiss controls; native notification text styles adapt to SystemUI light/dark themes. This is not React Native UI. The package is pinned and `postinstall` applies the patch, including after a clean prebuild. `expo.autolinking.android.buildFromSource` in package.json forces this module to compile from source; otherwise Expo can use a precompiled AAR that omits the custom layout.

Delivery remains Expo's `ExpoPresentationDelegate` → `NotificationManagerCompat.notify(identifier, 0, notification)`. Each reminder has a distinct identifier/tag, so later reminders do not replace earlier ones. Expo's original response PendingIntent and payload extras remain intact; taps open Vault and route to the task or topic. Auto-cancel and swipe dismissal are standard Android behavior. Foreground presentation uses the same native pipeline.

The `vault_reminders` channel is initialized once with HIGH importance, default system sound, vibration and private lock-screen visibility. Existing channel settings are never overwritten or deleted. Android 13+ permission is requested when reminders are enabled; denied permission produces a settings message. Heads-up, screen wake, sound, vibration and lock-screen visibility remain subject to Android, DND and the user's settings. No full-screen intents or DND bypass are used.

Scheduling uses Expo's native persisted AlarmManager requests and boot receiver, not JavaScript timers. One minute is the requested cadence, not an exact-delivery guarantee in Android idle modes. Rebuild the Android binary to install the native layout patch; an OTA/Metro refresh alone cannot add RemoteViews resources.

Device acceptance: verify compact/expanded content in light and dark mode, foreground/background/offline delivery, independent alerts, tap routes, swipe dismissal, denied permission and a muted/blocked channel. Verify a user-modified channel remains unchanged after reopening Vault.

### Verification (2026-09-17)

- 27 reminder tests pass; notification TypeScript/TSX lint passes.
- Android arm64 debug APK built successfully with `:app:assembleDebug -PreactNativeArchitectures=arm64-v8a --max-workers=2` and installed on a connected Android 14 phone without uninstalling.
- Two temporary alerts appeared as separate Android NotificationManager records. Device inspection confirmed `DecoratedCustomViewStyle`, compact/expanded/heads-up RemoteViews, HIGH importance, app-launch PendingIntents, default notification sound, vibration and no DND bypass. Android applied its own rapid-alert sound throttling. The temporary alerts and scheduled test request are no longer present.
- Scheduled background delivery was not conclusively observed in this device run; the native AlarmManager integration remains in place. Full lock-screen, idle-mode, tap-route and visual theme acceptance checks remain manual.
- Full project TypeScript check still reports the pre-existing `/explore` route mismatch in `src/components/app-tabs.web.tsx`.

The right-side notification artwork comes from `assets/images/notification logo.png`. `scripts/sync-notification-assets.cjs` copies it unchanged into the notification module’s Android drawable resources during `postinstall`. Compact/heads-up views use 36dp artwork; expanded views use 56dp. Run that script and rebuild Android after replacing the image.
