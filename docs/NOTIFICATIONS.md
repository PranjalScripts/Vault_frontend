# Notifications

Vault uses a backend inbox and remote phone alerts. Vercel Cron calls the Express backend, which resolves reminder eligibility from MongoDB and sends Android pushes through Firebase Admin/FCM. See [backend notification guide](../../Backend/NOTIFICATIONS.md) and [Android Firebase setup](FIREBASE_PUSH.md).

`expo-notifications` stays installed for native token registration, permission handling, Android notification channels, foreground presentation and notification taps. Android registers native FCM tokens; iOS retains its existing Expo/APNs integration. Inbox and preference APIs remain authenticated and account-scoped.

Legacy local reminder scheduling is retired. Startup removes only old `vault-local-*` schedules/presentations, preserving remote cold-start taps. Games still use snapshotStore for local saves.

Run `node --test tests/reminders.test.cjs` for registration, permissions, cold-start preservation, navigation and account cleanup tests. Real background/terminated delivery must also be tested on a physical Android device with the updated app installed.
